import jwt from 'jsonwebtoken';

const generateCookie = (userId, res) => {
    const token = jwt.sign({ userId }, "thisismysecrect", {
        expiresIn: '30d'
    });
    res.cookie('jwt', token, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
    });
    
};

export default generateCookie;