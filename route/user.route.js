import express from "express";
import { getdata, loginController,forgotPasswordController, logoutController, signupController, resetPasswordController } from "../controller/user.controller.js";

const route = express.Router();


route.post('/signup',signupController)
route.post('/forgot-password',forgotPasswordController)
route.post('/reset-password/:token', resetPasswordController);
route.post('/login',loginController)
route.post('/logout',logoutController)
route.get('/getOrders',getdata)

export default route;