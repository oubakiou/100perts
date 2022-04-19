import { FC } from 'react'
import { Card, CardContent, Typography } from '@mui/material'
import Link from 'next/link'

type StatusCardProps = {
  id: string
  body: string
  author: string
  createdAt: string
  linkEnabled?: boolean
}

export const StatusCard: FC<StatusCardProps> = ({
  id,
  body,
  author,
  createdAt,
  linkEnabled = true,
}) => {
  const date = new Date(createdAt).toLocaleString()

  return (
    <Card>
      <CardContent>
        <Typography gutterBottom variant="h3" component="div">
          {body}
        </Typography>
        <Typography gutterBottom variant="subtitle2" component="div">
          {author}
        </Typography>
        <Typography gutterBottom variant="subtitle2" component="div">
          {linkEnabled ? (
            <Link href={`/statuses/${id}`} prefetch={false}>
              <a>{date}</a>
            </Link>
          ) : (
            date
          )}
        </Typography>
      </CardContent>
    </Card>
  )
}
