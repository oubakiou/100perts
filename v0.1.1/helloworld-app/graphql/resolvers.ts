import { Resolvers } from './generated/resolvers-types'

// スキーマを実際に動作させるリゾルバー(実装)
export const resolvers: Resolvers = {
  Query: {
    statuses() {
      return listStatuses()
    },
    status(_parent, args) {
      return getStatus(args?.id) ?? null
    },
    banners(_parent, args) {
      return listBanners(args.groupId)
    },
  },
  Status: {
    author: (parent) => {
      return getAuthor(parent.authorId) ?? null
    },
  },
}

const listStatuses = (): Status[] => statuses

const getStatus = (id: string): Status | undefined =>
  statuses.find((d) => d.id === id)

const getAuthor = (id: string): Author | undefined =>
  authors.find((a) => a.id === id)

const listBanners = (groupId: string): Banner[] =>
  banners.filter((b) => b.groupId === groupId)

// ハードコーディングされたデータ
export type Status = {
  id: string
  body: string
  authorId: string
  createdAt: string
}
const statuses: Status[] = [
  {
    id: '2',
    authorId: '1',
    body: 'inviting coworkers',
    createdAt: new Date(2021, 4, 2).toISOString(),
  },
  {
    id: '1',
    authorId: '1',
    body: 'just setting up my app',
    createdAt: new Date(2021, 4, 1).toISOString(),
  },
]

export type Author = { id: string; name: string }
const authors: Author[] = [
  {
    id: '1',
    name: 'jack',
  },
]

type Banner = {
  id: string
  groupId: string
  href: string | null
}
const banners: Banner[] = [
  {
    id: '2',
    groupId: '1',
    href: null,
  },
  {
    id: '1',
    groupId: '1',
    href: null,
  },
]
