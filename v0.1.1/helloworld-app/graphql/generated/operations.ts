import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

/** 作者 */
export type Author = {
  __typename?: 'Author';
  id: Scalars['ID'];
  name: Scalars['String'];
};

/** バナー */
export type Banner = {
  __typename?: 'Banner';
  groupId: Scalars['ID'];
  href?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
};

/** クエリーの一覧 */
export type Query = {
  __typename?: 'Query';
  banners: Array<Maybe<Banner>>;
  status?: Maybe<Status>;
  statuses: Array<Maybe<Status>>;
};


/** クエリーの一覧 */
export type QueryBannersArgs = {
  groupId: Scalars['ID'];
};


/** クエリーの一覧 */
export type QueryStatusArgs = {
  id: Scalars['ID'];
};

/** つぶやき */
export type Status = {
  __typename?: 'Status';
  author?: Maybe<Author>;
  body: Scalars['String'];
  createdAt: Scalars['String'];
  id: Scalars['ID'];
};

export type StatusPagePropsQueryVariables = Exact<{
  statusId: Scalars['ID'];
  bannerGroupId: Scalars['ID'];
}>;


export type StatusPagePropsQuery = { __typename?: 'Query', status?: { __typename?: 'Status', id: string, body: string, createdAt: string, author?: { __typename?: 'Author', id: string, name: string } | null } | null, banners: Array<{ __typename?: 'Banner', id: string, href?: string | null } | null> };


export const StatusPagePropsDocument = gql`
    query StatusPageProps($statusId: ID!, $bannerGroupId: ID!) {
  status(id: $statusId) {
    id
    body
    author {
      id
      name
    }
    createdAt
  }
  banners(groupId: $bannerGroupId) {
    id
    href
  }
}
    `;

/**
 * __useStatusPagePropsQuery__
 *
 * To run a query within a React component, call `useStatusPagePropsQuery` and pass it any options that fit your needs.
 * When your component renders, `useStatusPagePropsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStatusPagePropsQuery({
 *   variables: {
 *      statusId: // value for 'statusId'
 *      bannerGroupId: // value for 'bannerGroupId'
 *   },
 * });
 */
export function useStatusPagePropsQuery(baseOptions: Apollo.QueryHookOptions<StatusPagePropsQuery, StatusPagePropsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<StatusPagePropsQuery, StatusPagePropsQueryVariables>(StatusPagePropsDocument, options);
      }
export function useStatusPagePropsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<StatusPagePropsQuery, StatusPagePropsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<StatusPagePropsQuery, StatusPagePropsQueryVariables>(StatusPagePropsDocument, options);
        }
export type StatusPagePropsQueryHookResult = ReturnType<typeof useStatusPagePropsQuery>;
export type StatusPagePropsLazyQueryHookResult = ReturnType<typeof useStatusPagePropsLazyQuery>;
export type StatusPagePropsQueryResult = Apollo.QueryResult<StatusPagePropsQuery, StatusPagePropsQueryVariables>;