const mongoclient = require("mongodb").MongoClient;

const mongodb_url = 'mongodb+srv://leeyun:dldbstp1234@myboard.qepi3hp.mongodb.net/?retryWrites=true&w=majority&appName=myboard';
let mydb;

async function connectToDatabase() {
    try {
        const client = await mongoclient.connect(mongodb_url);
        mydb = client.db('myboard');
        console.log('MongoDB에 연결되었습니다');
        return mydb; // 이 부분 추가
    } catch (error) {
        console.error('MongoDB 연결 실패:', error);
        return null;
    }
}

module.exports = { connectToDatabase, mydb };