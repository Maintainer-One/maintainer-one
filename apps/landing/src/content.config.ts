import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
	}),
});

const blog = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		pubDate: z.date(),
		description: z.string().optional(),
		author: z.string().optional(),
		image: z.object({
			url: z.string(),
			alt: z.string()
		}).optional(),
		tags: z.array(z.string()).optional(),
	}),
});

export const collections = { docs, blog };
