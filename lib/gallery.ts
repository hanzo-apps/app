interface GalleryProject {
  id: string;
  title: string;
  description: string;
  author: string;
  authorAvatar?: string;
  emoji: string;
  html: string;
  thumbnail?: string;
  tags: string[];
  createdAt: string;
  url?: string;
  remixes: number;
  likes: number;
}

interface GalleryConfig {
  spaceId: string;
  token: string;
}

class GalleryService {
  private spaceId = 'hanzoai/gallery';
  private apiUrl = process.env.GALLERY_API_URL || 'https://api.hanzo.ai/gallery';

  /**
   * Add a project to the public gallery
   */
  async addToGallery(project: {
    id: string;
    title: string;
    description: string;
    author: string;
    emoji: string;
    html: string;
    tags?: string[];
  }): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Generate a thumbnail from the HTML if possible
      const thumbnail = await this.generateThumbnail(project.html);

      const galleryProject: GalleryProject = {
        id: project.id,
        title: project.title,
        description: project.description,
        author: project.author,
        emoji: project.emoji,
        html: project.html,
        thumbnail,
        tags: project.tags || ['ai-generated', 'hanzo'],
        createdAt: new Date().toISOString(),
        url: `https://hanzo.ai/gallery/${project.author}/${project.id}`,
        remixes: 0,
        likes: 0,
      };

      // Store in gallery database (Hugging Face Space dataset)
      const stored = await this.storeInGallery(galleryProject);

      if (stored) {
        // Update the gallery index
        await this.updateGalleryIndex(galleryProject);

        return {
          success: true,
          url: `https://hanzo.ai/gallery/${project.id}`,
        };
      }

      return {
        success: false,
        error: 'Failed to store project in gallery',
      };
    } catch (error) {
      console.error('Gallery error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate a thumbnail from HTML content
   */
  private async generateThumbnail(html: string): Promise<string> {
    // For now, return a placeholder
    // In production, this would use a headless browser or screenshot service
    return '/api/placeholder/400/300';
  }

  /**
   * Store project in gallery database
   */
  private async storeInGallery(project: GalleryProject): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.HANZO_API_TOKEN}`,
        },
        body: JSON.stringify({
          data: project,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to store in gallery:', error);
      return false;
    }
  }

  /**
   * Update the gallery index file
   */
  private async updateGalleryIndex(project: GalleryProject): Promise<void> {
    try {
      // Update the index.json file in the Hugging Face Space
      const indexPath = 'index.json';

      // Fetch current index
      const currentIndex = await this.fetchGalleryIndex();

      // Add new project to the beginning
      currentIndex.unshift({
        id: project.id,
        title: project.title,
        author: project.author,
        emoji: project.emoji,
        createdAt: project.createdAt,
        tags: project.tags,
      });

      // Keep only the latest 1000 projects
      const updatedIndex = currentIndex.slice(0, 1000);

      // Update the index file
      await fetch(`${this.apiUrl}/index`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.HANZO_API_TOKEN}`,
        },
        body: JSON.stringify(updatedIndex),
      });
    } catch (error) {
      console.error('Failed to update gallery index:', error);
    }
  }

  /**
   * Fetch the current gallery index
   */
  private async fetchGalleryIndex(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/index`
      );

      if (response.ok) {
        return await response.json();
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch gallery index:', error);
      return [];
    }
  }

  /**
   * Get featured projects from the gallery
   */
  async getFeaturedProjects(limit = 12): Promise<GalleryProject[]> {
    try {
      const index = await this.fetchGalleryIndex();
      return index.slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch featured projects:', error);
      return [];
    }
  }

  /**
   * Search projects in the gallery
   */
  async searchProjects(query: string, limit = 20): Promise<GalleryProject[]> {
    try {
      const index = await this.fetchGalleryIndex();

      const filtered = index.filter(project =>
        project.title.toLowerCase().includes(query.toLowerCase()) ||
        project.tags?.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))
      );

      return filtered.slice(0, limit);
    } catch (error) {
      console.error('Failed to search projects:', error);
      return [];
    }
  }
}

export const galleryService = new GalleryService();

/**
 * Helper function to add a project to the gallery
 */
export async function addProjectToGallery(
  projectData: {
    id: string;
    name: string;
    prompt: string;
    namespace: string;
    emoji: string;
    html: string;
  },
  user: { name?: string; email?: string; picture?: string }
): Promise<{ success: boolean; galleryUrl?: string }> {
  const result = await galleryService.addToGallery({
    id: projectData.id,
    title: projectData.name,
    description: projectData.prompt || 'AI-generated project',
    author: user.name || projectData.namespace,
    emoji: projectData.emoji,
    html: projectData.html,
    tags: extractTagsFromPrompt(projectData.prompt),
  });

  return {
    success: result.success,
    galleryUrl: result.url,
  };
}

/**
 * Extract relevant tags from the project prompt
 */
function extractTagsFromPrompt(prompt: string): string[] {
  const tags: string[] = ['ai-generated', 'hanzo'];

  // Add common keywords as tags
  const keywords = [
    'dashboard', 'website', 'app', 'game', 'tool',
    'react', 'vue', 'angular', 'svelte',
    'tailwind', 'bootstrap', 'css',
    '3d', 'animation', 'interactive',
    'api', 'database', 'backend',
    'ml', 'ai', 'chatbot', 'assistant',
  ];

  const lowerPrompt = prompt.toLowerCase();
  keywords.forEach(keyword => {
    if (lowerPrompt.includes(keyword)) {
      tags.push(keyword);
    }
  });

  return [...new Set(tags)]; // Remove duplicates
}