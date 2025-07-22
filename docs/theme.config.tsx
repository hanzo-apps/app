import React, { Fragment } from 'react'
import { useConfig, DocsThemeConfig } from 'nextra-theme-docs'
import LogoMark from '@/components/LogoMark'
import FooterMenu from '@/components/FooterMenu'
import JSONLD from '@/components/JSONLD'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { LibraryBig, Blocks, BrainCircuit, Computer } from 'lucide-react'
import { AiOutlineGithub } from 'react-icons/ai'
import { BiLogoDiscordAlt } from 'react-icons/bi'
import { RiTwitterXFill } from 'react-icons/ri'

const defaultUrl = 'https://hanzo.ai'
const defaultImage = 'https://hanzo.ai/assets/images/general/og-image.png'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'Hanzo AI',
  'url': `${defaultUrl}`,
  'logo': `${defaultImage}`,
}

const config: DocsThemeConfig = {
  logo: (
    <span className="flex gap-x-8 items-center">
      <div className="flex">
        <LogoMark />
        <span className="ml-2 text-lg font-semibold">Hanzo AI</span>
      </div>
    </span>
  ),
  docsRepositoryBase: 'https://github.com/hanzoai/hanzo/tree/dev/docs',
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'feedback',
  },
  editLink: {
    text: 'Edit this page on GitHub →',
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s - Hanzo AI',
      twitter: {
        cardType: 'summary_large_image',
        site: '@hanzodotai',
      },
      openGraph: {
        type: 'website',
      },
    }
  },
  navbar: {
    extraContent: (
      <div className="inline-flex items-center gap-x-2">
        <a href="https://discord.com/invite/FTk2MvZwJH" target="_blank">
          <BiLogoDiscordAlt className="text-xl text-black/60 dark:text-white/60" />
        </a>
        <a href="https://twitter.com/hanzodotai" target="_blank">
          <RiTwitterXFill className="text-lg text-black/60 dark:text-white/60" />
        </a>
        <a href="https://github.com/hanzoai/hanzo" target="_blank">
          <AiOutlineGithub className="text-xl text-black/60 dark:text-white/60" />
        </a>
      </div>
    ),
  },
  sidebar: {
    titleComponent: ({ type, title }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { asPath } = useRouter()
      if (type === 'separator' && title === 'Switcher') {
        return (
          <div className="-mx-2 hidden md:block">
            {[
              { title: 'Hanzo AI', path: '/docs', Icon: LibraryBig },
              {
                title: 'Hanzo AI Local Server',
                path: '/local-server',
                Icon: BrainCircuit,
              },
              // { title: 'Hanzo AI Mobile', path: '/platforms', Icon: Blocks },
              {
                title: 'Hanzo AI API Platform',
                path: '/platforms',
                Icon: Computer,
              },
            ].map((item) =>
              asPath.startsWith(item.path) ? (
                <div
                  key={item.path}
                  className="group mb-3 flex flex-row items-center gap-3 nx-text-primary-800 dark:nx-text-primary-600"
                >
                  <item.Icon className="w-7 h-7 p-1 border  border-gray-200 dark:border-gray-700 rounded nx-bg-primary-100 dark:nx-bg-primary-400/10" />
                  {item.title}
                </div>
              ) : (
                <Link
                  href={item.path}
                  key={item.path}
                  className="group mb-3 flex flex-row items-center gap-3 text-gray-500 hover:text-primary/100"
                >
                  <item.Icon className="w-7 h-7 p-1 border rounded border-gray-200 dark:border-gray-700" />
                  {item.title}
                </Link>
              )
            )}
          </div>
        )
      }
      return title
    },
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
  head: function useHead() {
    const { title, frontMatter } = useConfig()
    const titleTemplate = (frontMatter?.title || title) + ' - ' + 'Hanzo AI'
    const { asPath } = useRouter()

    return (
      <Fragment>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Language" content="en" />
        <title>{titleTemplate}</title>
        <meta name="og:title" content={titleTemplate} />
        <meta
          name="description"
          content={
            frontMatter?.description ||
            `Run LLMs like Qwen3 or Llama3 locally and offline on your computer, or connect to remote AI APIs like OpenAI's GPT-4 or Groq.`
          }
        />
        <meta
          name="og:description"
          content={
            frontMatter?.description ||
            `Run LLMs like Qwen3 or Llama3 locally and offline on your computer, or connect to remote AI APIs like OpenAI's GPT-4 or Groq.`
          }
        />
        <link
          rel="canonical"
          href={frontMatter?.ogImage ? 'https://hanzo.ai' + asPath : defaultUrl}
        />
        <meta
          property="og:url"
          content={
            frontMatter?.ogImage ? 'https://hanzo.ai' + asPath : defaultUrl
          }
        />
        <meta
          property="og:image"
          content={
            frontMatter?.ogImage
              ? 'https://hanzo.ai/' + frontMatter?.ogImage
              : 'https://hanzo.ai/assets/images/general/og-image.png'
          }
        />
        <meta property="og:image:alt" content="Hanzo AI-OGImage" />
        <meta
          name="keywords"
          content={
            frontMatter?.keywords?.map((keyword: string) => keyword) || [
              'Hanzo AI',
              'Customizable Intelligence, LLM',
              'local AI',
              'privacy focus',
              'free and open source',
              'private and offline',
              'conversational AI',
              'no-subscription fee',
              'large language models',
              'build in public',
              'remote team',
              'how we work',
            ]
          }
        />
        <JSONLD data={structuredData} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
        <style>{`
          :root {
            --nx-font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          }
          
          html {
            font-family: var(--nx-font-sans) !important;
          }
          
          body {
            font-family: var(--nx-font-sans) !important;
            background-color: #000000 !important;
            color: #ffffff !important;
          }
          
          /* Dark theme as default */
          :root {
            color-scheme: dark;
          }
          
          /* Force dark mode styles */
          .nextra-nav-container {
            background-color: rgba(0, 0, 0, 0.8) !important;
            backdrop-filter: blur(8px) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          
          .nextra-sidebar-container {
            background-color: #000000 !important;
            border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          
          .nextra-toc {
            background-color: #000000 !important;
            border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          
          /* Monochromatic color scheme */
          .nx-text-primary-600, .nx-text-primary-800 {
            color: #ffffff !important;
          }
          
          .nx-bg-primary-100, .nx-bg-primary-400 {
            background-color: rgba(255, 255, 255, 0.1) !important;
          }
          
          /* Links */
          a {
            color: rgba(255, 255, 255, 0.9) !important;
          }
          
          a:hover {
            color: #ffffff !important;
            text-decoration: underline !important;
          }
          
          /* Code blocks */
          pre {
            background-color: rgba(255, 255, 255, 0.05) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          
          code {
            background-color: rgba(255, 255, 255, 0.1) !important;
            color: #ffffff !important;
            font-family: 'Inter', monospace !important;
          }
          
          /* Tables */
          table {
            border-color: rgba(255, 255, 255, 0.2) !important;
          }
          
          th {
            background-color: rgba(255, 255, 255, 0.05) !important;
            border-color: rgba(255, 255, 255, 0.2) !important;
          }
          
          td {
            border-color: rgba(255, 255, 255, 0.1) !important;
          }
          
          /* Buttons */
          button {
            background-color: rgba(255, 255, 255, 0.1) !important;
            color: #ffffff !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
          }
          
          button:hover {
            background-color: rgba(255, 255, 255, 0.2) !important;
          }
          
          /* Search */
          .nextra-search input {
            background-color: rgba(255, 255, 255, 0.1) !important;
            border-color: rgba(255, 255, 255, 0.2) !important;
            color: #ffffff !important;
          }
          
          /* Sidebar items */
          .nextra-sidebar-container li > a {
            color: rgba(255, 255, 255, 0.7) !important;
          }
          
          .nextra-sidebar-container li > a:hover {
            background-color: rgba(255, 255, 255, 0.05) !important;
            color: #ffffff !important;
          }
          
          .nextra-sidebar-container li > a.active {
            background-color: rgba(255, 255, 255, 0.1) !important;
            color: #ffffff !important;
          }
          
          /* Footer */
          footer {
            background-color: #000000 !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          
          /* Scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          
          /* Sexy gradient accents */
          .nextra-nav-container .nextra-nav-container-blur {
            background: linear-gradient(to bottom, rgba(0, 0, 0, 0.9), transparent) !important;
          }
          
          /* Logo area */
          .nextra-nav-container .nextra-logo {
            font-weight: 700 !important;
            background: linear-gradient(135deg, #ffffff 0%, #888888 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          /* Active nav items with subtle gradient */
          .nextra-nav-container .nx-text-primary-600 {
            background: linear-gradient(135deg, #ffffff 0%, #cccccc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          /* Cards and boxes */
          .nx-border, .nx-border-gray-200 {
            border-color: rgba(255, 255, 255, 0.1) !important;
          }
          
          /* All text should use Inter */
          * {
            font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
          }
          
          /* Monospace code should still use a monospace font but with Inter as primary */
          pre, code, kbd, samp {
            font-family: 'Inter', 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Fira Mono', 'Roboto Mono', 'Courier New', monospace !important;
          }
        `}</style>
      </Fragment>
    )
  },
  footer: {
    text: <FooterMenu />,
  },
  nextThemes: {
    defaultTheme: 'dark',
  },
}

export default config
