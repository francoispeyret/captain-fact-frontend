import React from 'react'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import { Map } from 'immutable'
import { withNamespaces } from 'react-i18next'

import UserAction from '../UsersActions/UserAction'
import PaginationMenu from '../Utils/PaginationMenu'
import { LoadingFrame } from '../Utils/LoadingFrame'
import MessageView from '../Utils/MessageView'
import { ErrorView } from '../Utils/ErrorView'
import ActionsDirectionFilter from '../UsersActions/ActionsDirectionFilter'

const QUERY = gql`
  query UserActivityLog(
    $username: String!
    $offset: Int!
    $limit: Int!
    $direction: ActivityLogDirection!
  ) {
    user(username: $username) {
      id
      username
      name
      actions(limit: $limit, offset: $offset, direction: $direction) {
        pageNumber
        totalPages
        entries {
          id
          type
          entity
          time
          changes
          videoHashId
          statementId
          commentId
          speakerId
          authorReputationChange
          targetReputationChange
          userId
          user {
            id
            username
            name
          }
          targetUserId
          targetUser {
            id
            username
            name
          }
        }
      }
    }
  }
`

const renderPaginationMenu = (loading, user, fetchMore) => (
  <div className="panel-heading">
    <PaginationMenu
      disabled={loading}
      currentPage={user ? user.actions.pageNumber : 1}
      total={user ? user.actions.totalPages : 1}
      onPageChange={(selectedPage) =>
        fetchMore({
          variables: { offset: selectedPage },
          updateQuery: (_, { fetchMoreResult }) => fetchMoreResult,
        })
      }
    />
  </div>
)

const ActivityLog = ({ params: { username }, t, location }) => {
  const direction = location.query.direction || 'ALL'
  return (
    <Query
      query={QUERY}
      variables={{ username, offset: 1, limit: 10, direction }}
      fetchPolicy="network-only"
    >
      {({ loading, data, fetchMore, error }) => {
        if (error) {
          return <ErrorView error={error} />
        }

        if (!loading && data.user.actions.entries.length === 0) {
          return <MessageView>{t('noActivity')}</MessageView>
        }

        const paginationMenu = renderPaginationMenu(loading, data.user, fetchMore)
        return (
          <div>
            <div className="activity-log container">
              <p className="panel-heading">{t('main:menu.activity')}</p>
              {data.user && <ActionsDirectionFilter user={data.user} value={direction} />}
              {loading ? (
                <div className="panel-block">
                  <LoadingFrame />
                </div>
              ) : (
                data.user.actions.entries.map((a) => (
                  <UserAction
                    key={a.id}
                    action={{ ...a, changes: new Map(JSON.parse(a.changes)) }}
                    withoutUser
                    viewingFrom={data.user}
                  />
                ))
              )}
              {paginationMenu}
            </div>
          </div>
        )
      }}
    </Query>
  )
}

export default withNamespaces('user')(ActivityLog)
