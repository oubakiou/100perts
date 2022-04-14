import { NextApiHandler } from 'next'

const handler: NextApiHandler<Response> = (req, res): void =>
  res.status(200).json(statuses)

// レスポンス型
type Response = Status[]
type Status = {
  id: string
  body: string
  author: string
  createdAt: Date
}

// ハードコーディングされたデータ
const statuses: Status[] = [
  {
    id: '2',
    body: 'inviting coworkers',
    author: 'jack',
    createdAt: new Date(2022, 1, 10),
  },
  {
    id: '1',
    body: 'just setting up my app',
    author: 'jack',
    createdAt: new Date(2022, 0, 10),
  },
]

export default handler
