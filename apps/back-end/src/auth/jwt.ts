import jwt from 'jsonwebtoken'; 

// secret key → token sign hiihad ashiglana
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_for_diplom';

// token hedii hugatsaand huchintei baih
const EXPIRES_IN = '2h';


// token uusgeh function (login hiisnii daraa ashiglana)
export function signToken(payload: object) {
  return jwt.sign(
    payload,        // token dotor хадгалах data (userId, role гэх мэт)
    JWT_SECRET,     // nuuts key (server deer l baidag)
    { expiresIn: EXPIRES_IN } // hugatsaa (2 tsag)
  );
}


// token shalgah function (middleware deer ashiglana)
export function verifyToken(token: string) {
  return jwt.verify(
    token,       // frontend-ees irsen token
    JWT_SECRET   // adil secret-oor shalgana
  );
}