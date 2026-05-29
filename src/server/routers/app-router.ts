import { os } from '@orpc/server'
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
import {
  getSummaryCards,
  getCashflowChart,
  getUpcomingEvents,
  getRecentActivity,
} from './dashboard'
import { listActivityLogs } from './activity-logs'
import {
  createTeacher,
  deactivateTeacher,
  executeTeacherImport,
  exportTeachers,
  getTeacherById,
  listTeachers,
  previewTeacherImport,
  updateTeacher,
} from './teachers'
import {
  createClass,
  getClassById,
  listClasses,
  massPromotion,
  updateClass,
} from './classes'
import {
  changeStatus,
  create as createStudent,
  getById as getStudentById,
  getStatusHistory,
  list as listStudents,
  update as updateStudent,
} from './students'

export const appRouter = os.router({
  admin: os.router({
    users: os.router({
      list: listUsersWithAssignments,
      assign: assignUserToSchool,
      toggleAssignment,
    }),
  }),
  tenant: os.router({
    schools: os.router({
      get: getSchool,
      update: updateSchool,
    }),
    units: os.router({
      list: listUnits,
      getById: getUnitById,
      create: createUnit,
      update: updateUnit,
    }),
    academicYears: os.router({
      list: listAcademicYears,
      getActive: getActiveAcademicYear,
      create: createAcademicYear,
      update: updateAcademicYear,
      activate: activateAcademicYear,
    }),
    dashboard: os.router({
      getSummaryCards,
      getCashflowChart,
      getUpcomingEvents,
      getRecentActivity,
    }),
    activityLogs: os.router({
      list: listActivityLogs,
    }),
    teachers: os.router({
      list: listTeachers,
      getById: getTeacherById,
      create: createTeacher,
      update: updateTeacher,
      deactivate: deactivateTeacher,
      previewImport: previewTeacherImport,
      executeImport: executeTeacherImport,
      export: exportTeachers,
    }),
    classes: os.router({
      list: listClasses,
      getById: getClassById,
      create: createClass,
      update: updateClass,
      massPromotion,
    }),
    students: os.router({
      list: listStudents,
      getById: getStudentById,
      create: createStudent,
      update: updateStudent,
      changeStatus,
      getStatusHistory,
    }),
  }),
})
