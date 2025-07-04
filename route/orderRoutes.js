import express from 'express';
import { updateOrderStatus } from '../controller/orderController.js';

const route = express.Router();

route.put('/update-status/:orderId', updateOrderStatus);

export default route;
