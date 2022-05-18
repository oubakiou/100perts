import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const jack = await prisma.user.create({
    data: {
      name: 'jack',
      Status: {
        create: [
          {
            body: 'just setting up my app',
            createdAt: new Date('2006/03/22 11:00:00'),
          },
          {
            body: 'inviting coworkers',
            createdAt: new Date('2014/03/22 12:00:00'),
          },
          { body: 'MySQL server has gone away...?' },
        ],
      },
    },
  })
  console.log(`Created user with id: ${jack.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
