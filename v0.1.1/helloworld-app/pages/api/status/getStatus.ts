import { NextApiHandler } from 'next'

const handler: NextApiHandler<Response> = (req, res): void => {
  const status = statuses.find((status) => status.id === req.query.id)
  status
    ? res.status(200).json(status)
    : res.status(404).json({ message: 'not found' })
}

// レスポンス型
type Response = Failure | Success

// 失敗した場合のレスポンス型
type Failure = { message: string }

// 成功した場合のレスポンス型
type Success = Status
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
