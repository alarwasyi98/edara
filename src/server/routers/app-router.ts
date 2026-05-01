import {
  listUsersWithAssignments,
  assignUserToSchool,
  toggleAssignment,
} from './admin/users'
import {
  getSchool,
  updateSchool,
  listUnits,
  getUnitById,
  createUnit,
  updateUnit,
} from './tenant'
import {
  listAcademicYears,
  getActiveAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  activateAcademicYear,
} from './academic-years'

export const appRouter = {
  admin: {
    users: {
      list: listUsersWithAssignments,
      assign: assignUserToSchool,
      toggleAssignment,
    },
  },
  tenant: {
    schools: {
      get: getSchool,
      update: updateSchool,
    },
    units: {
      list: listUnits,
      getById: getUnitById,
      create: createUnit,
      update: updateUnit,
    },
    academicYears: {
      list: listAcademicYears,
      getActive: getActiveAcademicYear,
      create: createAcademicYear,
      update: updateAcademicYear,
      activate: activateAcademicYear,
    },
  },
}
