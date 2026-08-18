import { defineField, defineType } from 'sanity'

export const resourceType = defineType({
  name: 'resource',
  title: 'Resource',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'description', type: 'text' }),
    defineField({
      name: 'type',
      type: 'string',
      options: { list: ['Blog', 'Tutorial', 'Course', 'Featured'] },
      initialValue: 'Blog',
    }),
    defineField({ name: 'url', type: 'url' }),
    defineField({ name: 'addedOn', title: 'Added On', type: 'date', options: { dateFormat: 'yyyy-MM-dd' } }),
    defineField({
      name: 'authors',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', type: 'string' },
            { name: 'slug', type: 'string' },
            { name: 'kind', type: 'string', options: { list: ['member', 'external'] } },
          ],
        },
      ],
    }),
    defineField({ name: 'featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'coverImage', title: 'Cover Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'body', title: 'Body Content', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }),
  ],
})
