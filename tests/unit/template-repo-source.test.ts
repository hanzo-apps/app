/**
 * A template's SOURCE is its repository, and only a document counts.
 *
 * `templatePages` knew two sources — a document we ship, and a deployed site we
 * can lift — and neither asks git. So a slug whose markup sits in
 * `hanzo-apps/<slug>` with no shipped preview and no verified demo answered
 * "no source", and the builder told the user it was recreating the template from
 * its description and wrote an imitation. Measured: `hanzo-apps/soar` is a real,
 * non-empty repository on git.hanzo.ai while `/v1/templates/soar/pages` returned
 * `no source for slug`.
 *
 * The risk in reading a repo is the opposite failure: handing the preview a
 * framework project whose `/src/*.tsx` has never been compiled, which opens as a
 * blank page. So the tree is filtered to HTML that parses AS a document. These
 * assert both halves — it finds real markup, and it refuses everything else.
 */
jest.mock('@/lib/git/forge', () => ({
  forgeConfigured: jest.fn(() => true),
  getRepo: jest.fn(),
  listForgeCommits: jest.fn(),
  forgeCommitPages: jest.fn(),
}));
jest.mock('@/lib/template-previews', () => ({ getLocalTemplatePreview: () => null }));
jest.mock('@/lib/template-demos', () => ({ demoUrl: () => null, lifts: () => false }));

import { templatePages } from '@/lib/template-source';
import * as forge from '@/lib/git/forge';

const f = forge as jest.Mocked<typeof forge>;
const repo = () => {
  f.getRepo.mockResolvedValue({ default_branch: 'main' } as never);
  f.listForgeCommits.mockResolvedValue([{ sha: 'abc123' }] as never);
};

beforeEach(() => jest.clearAllMocks());

it('opens the repository when it holds a document', async () => {
  repo();
  f.forgeCommitPages.mockResolvedValue([
    { path: 'about.html', html: '<!doctype html><html><body>About</body></html>' },
    { path: 'index.html', html: '<!doctype html><html><body>Home</body></html>' },
  ]);
  const pages = await templatePages('soar');
  expect(pages).not.toBeNull();
  // index is the front door, whatever order the tree gave.
  expect(pages!.map((p) => p.path)).toEqual(['index.html', 'about.html']);
});

it('refuses a project that has never been compiled', async () => {
  repo();
  f.forgeCommitPages.mockResolvedValue([
    { path: 'src/App.tsx', html: 'export default function App() { return <div/> }' },
    { path: 'package.json', html: '{"name":"soar"}' },
    { path: 'README.md', html: '# soar' },
  ]);
  // Not "an empty page" — NOTHING, so the caller says it is recreating rather
  // than opening a blank document and calling it the template.
  expect(await templatePages('soar')).toBeNull();
});

it('refuses an .html file that is not a document', async () => {
  repo();
  f.forgeCommitPages.mockResolvedValue([{ path: 'partial.html', html: '<div>fragment</div>' }]);
  expect(await templatePages('soar')).toBeNull();
});

it('treats an unreachable forge as no source, never as an error', async () => {
  f.getRepo.mockRejectedValue(new Error('forge down'));
  await expect(templatePages('soar')).resolves.toBeNull();
});

it('does not ask git when the forge is not wired', async () => {
  f.forgeConfigured.mockReturnValue(false);
  expect(await templatePages('soar')).toBeNull();
  expect(f.getRepo).not.toHaveBeenCalled();
});
