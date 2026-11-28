import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { absoluteUrl } from '@/lib/site';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/projects'), changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteUrl('/quote'), changeFrequency: 'monthly', priority: 0.7 },
  ];
  try {
    const projects = await db.project.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } });
    for (const project of projects) pages.push({ url: absoluteUrl(`/projects/${encodeURIComponent(project.slug)}`), lastModified: project.updatedAt, changeFrequency: 'monthly', priority: 0.8 });
  } catch (error) { console.error('Sitemap project query failed:', error); }
  return pages;
}
