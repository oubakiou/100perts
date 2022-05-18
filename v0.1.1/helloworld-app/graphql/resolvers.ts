import { Resolvers } from './generated/resolvers-types'
import { PrismaClient } from '@prisma/client'

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

const prisma = new PrismaClient()

const listStatuses = async () => {
  const statuses = await prisma.status.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return statuses.map((status) => ({
    ...status,
    createdAt: status.createdAt?.toISOString(),
  }))
}

const getStatus = async (id: string) => {
  const status = await prisma.status.findUnique({ where: { id: id } })

  return { ...status, createdAt: status?.createdAt?.toISOString() }
}
const getAuthor = (id: string) => prisma.user.findUnique({ where: { id: id } })

const listBanners = async (groupId: string) => {
  const banners = await prisma.banner.findMany({
    where: { bannerGroupId: groupId },
  })

  // bannerGroupIdをgroupIdというフィールド名でマッピング
  return banners.map((banner) => ({ ...banner, groupId: banner.bannerGroupId }))
}
