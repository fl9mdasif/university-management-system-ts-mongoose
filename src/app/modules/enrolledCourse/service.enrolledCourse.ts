import httpStatus from 'http-status';
import AppError from '../../errors/AppErrors';
import { OfferedCourse } from '../offeredCourse/model.offeredCourse';
import EnrolledCourse from './model.enrolledCourse';
import { Student } from '../students/model.student';
import { TEnrolledCourse } from './interface.enrolledCourse';
import { Course } from '../course/model.course';
import { SemesterRegistration } from '../semesterRegistration/model.semesterRegistration';
import mongoose from 'mongoose';

const createEnrolledCourse = async (
  userId: string,
  payload: TEnrolledCourse,
) => {
  /**
   * Step1: Check if the offered courses is exists
   * Step2: Check if the student is already enrolled
   * Step3: Check if the max credits exceed
   * Step4: Create an enrolled course
   */
  const { offeredCourse } = payload;
  // console.log(payload);

  // 01
  const isOfferedCourseExists = await OfferedCourse.findById(offeredCourse);

  if (!isOfferedCourseExists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Offered course not found !');
  }

  // 02
  const student = await Student.findOne({ id: userId }, { _id: 1 });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student not found !');
  }

  // already enrolled?
  const isStudentAlreadyEnrolled = await EnrolledCourse.findOne({
    semesterRegistration: isOfferedCourseExists?.semesterRegistration,
    offeredCourse,
    student: student._id,
  });

  if (isStudentAlreadyEnrolled) {
    throw new AppError(httpStatus.CONFLICT, 'Student is already enrolled !');
  }

  // check max capacity
  if (isOfferedCourseExists.maxCapacity <= 0) {
    throw new AppError(httpStatus.BAD_GATEWAY, 'Room is full !');
  }

  // 03 check total credits exceeds maxCredit
  const course = await Course.findById(isOfferedCourseExists.course);
  const currentCredit = course?.credits;

  // search semester registration
  const semesterRegistration = await SemesterRegistration.findById(
    isOfferedCourseExists.semesterRegistration,
  ).select('maxCredit');

  const maxCredit = semesterRegistration?.maxCredit;

  const enrolledCourses = await EnrolledCourse.aggregate([
    {
      $match: {
        semesterRegistration: isOfferedCourseExists.semesterRegistration,
        student: student._id,
      },
    },
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'enrolledCourseData',
      },
    },
    {
      $unwind: '$enrolledCourseData',
    },
    {
      $group: {
        _id: null,
        totalEnrolledCredits: { $sum: '$enrolledCourseData.credits' },
      },
    },
    {
      $project: {
        _id: 0,
        totalEnrolledCredits: 1,
      },
    },
  ]);

  // //  total enrolled credits + new enrolled course credit > maxCredit
  const totalCredits =
    enrolledCourses.length > 0 ? enrolledCourses[0].totalEnrolledCredits : 0;

  if (totalCredits && maxCredit && totalCredits + currentCredit > maxCredit) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You have exceeded maximum number of credits !',
    );
  }

  // Transaction
  const session = await mongoose.startSession();

  try {
    session.startTransaction(); // 04

    const result = await EnrolledCourse.create([
      {
        semesterRegistration: isOfferedCourseExists.semesterRegistration,
        academicSemester: isOfferedCourseExists.academicSemester,
        academicFaculty: isOfferedCourseExists.academicFaculty,
        academicDepartment: isOfferedCourseExists.academicDepartment,
        offeredCourse: offeredCourse,
        course: isOfferedCourseExists.course,
        student: student._id,
        faculty: isOfferedCourseExists.faculty,
        isEnrolled: true,
      },
    ]);
    console.log(enrolledCourses);

    // console.log(result);
    if (!result) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'failed to enrolled the course',
      );
    }
    // update max capacity
    const maxCapacity = isOfferedCourseExists.maxCapacity;
    await OfferedCourse.findByIdAndUpdate(offeredCourse, {
      maxCapacity: maxCapacity - 1,
    });

    // commit transaction
    await session.commitTransaction(); // step 4 (save data into database)

    // end session
    await session.endSession(); // step 5

    return result;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(err);
  }
};

export const enrolledCourseServices = {
  createEnrolledCourse,
};
