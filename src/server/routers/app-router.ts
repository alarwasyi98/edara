import {
  listUsersWithAssignments,
  assignUserToSchool,
  toggleAssignment,
} from './admin/users'

export const appRouter = {
  admin: {
    users: {
      list: listUsersWithAssignments,
      assign: assignUserToSchool,
      toggleAssignment,
    },
  },
}
