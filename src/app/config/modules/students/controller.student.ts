import { Request, Response } from 'express';
import { StudentServices } from './service.student';

const createStudent = async (req: Request, res: Response) => {
  try {
    const { student: studentDate } = req.body;
    const result = await StudentServices.createStudent(studentDate);

    res.status(200).json({
      success: true,
      message: 'Student created successfully',
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Student created successfully',
      error: err,
    });
  }
};

const getAllStudents = async (req: Request, res: Response) => {
  try {
    const result = await StudentServices.getAllStudents();

    res.status(200).json({
      success: true,
      message: 'Something went wrong',
      data: result,
    });
  } catch (err) {
    console.log(err);
  }
};

// single student

const getSingleStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const result = await StudentServices.getSingleStudent(studentId);

    res.status(200).json({
      success: true,
      message: 'single Students are retrieved successfully',
      data: result,
    });
  } catch (err) {
    console.log(err);
  }
};

export const studentControllers = {
  createStudent,
  getAllStudents,
  getSingleStudent,
};
