const express = require('express');
const { mydb } = require('./database'); // database.js 파일에서 mydb를 export 했다고 가정
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { ObjectId } = require('mongodb');

// 데이터베이스 연결
async function connectToDatabase() {
    const mongoclient = require("mongodb").MongoClient;
    const mongodb_url = 'mongodb+srv://leeyun:dldbstp1234@myboard.qepi3hp.mongodb.net/?retryWrites=true&w=majority&appName=myboard';
    
    try {
        const client = await mongoclient.connect(mongodb_url);
        return client.db('myboard');
    } catch (err) {
        console.error('Failed to connect to the database:', err);
        throw err;
    }
}

// 업로드 디렉토리 설정
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Multer 스토리지 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

async function setRoutes(app) {
    // 데이터베이스 연결
    await connectToDatabase(); // 수정된 부분
    app.post('/login', async (req, res) => {
        const { username, password } = req.body;
    
        // 사용자 이름으로 MongoDB에서 사용자 정보를 찾음
        const user = await mydb.collection('users').findOne({ username: username });
        
        if (user) {
            // 비밀번호가 일치하면 세션에 로그인 정보 저장 후 메인 페이지로 이동
            if (user.password === password) {
                req.session.user = user; // 세션에 로그인 정보 저장
                res.redirect('/main');
            } else {
                // 비밀번호가 일치하지 않으면 로그인 실패 메시지 출력
                res.send('비밀번호가 일치하지 않습니다.');
            }
        } else {
            // 해당 사용자 이름이 MongoDB에 없으면 로그인 실패 메시지 출력
            res.send('사용자를 찾을 수 없습니다.');
        }
    });

    app.get('/main', function (req, res) {
        // 세션에 로그인 정보가 없으면 로그인 페이지로 이동
        if (!req.session.user) {
            res.redirect('/');
        } else {
            // 세션에 저장된 사용자 정보를 데이터로 전달하여 렌더링
            mydb.collection('post').find().toArray().then(result => {
                res.render('listmongo.ejs', { user: req.session.user, data: result });
            }).catch(err => {
                console.log('Failed to fetch post data:', err);
                res.status(500).send('Failed to fetch post data');
            });
        }
    });

    app.post('/logout', function (req, res) {
        // 세션에서 로그인 정보 삭제 후 로그인 페이지로 이동
        req.session.destroy();
        res.redirect('/');
    });
    
    app.get('/createPost', function (req, res) {
        res.render('createPost.ejs');
    });
    
    app.post('/createPost', upload.single('image'), async (req, res) => {
        const { title, caption } = req.body;
        const image = req.file;
    
        try {
            let imageData = {}; // 이미지 데이터를 저장할 객체 생성
    
            // 이미지가 전송된 경우에만 이미지 데이터 저장
            if (image) {
                imageData = { image: '/uploads/' + image.filename };
            }
    
            // MongoDB에 게시글 정보 저장
            await mydb.collection('post').insertOne({
                title: title,
                caption: caption,
                ...imageData // 이미지 데이터 객체 병합
            });
    
            res.redirect('/main'); // 게시물이 성공적으로 작성되면 메인 페이지로 이동
        } catch (err) {
            console.log('Failed to create post:', err);
            res.status(500).send('게시물 작성에 실패했습니다.');
        }
    });
    app.post('/deletemongo', async (req, res) => {
        const postId = req.body._id;
        try {
            // MongoDB에서 해당 ID의 게시물 삭제
            await mydb.collection('post').deleteOne({ _id: new objId(postId) }); // ObjectId 생성자 호출 수정
            res.status(200).send('게시물이 성공적으로 삭제되었습니다.');
        } catch (err) {
            console.log('Failed to delete post:', err);
            res.status(500).send('게시물 삭제에 실패했습니다.');
        }
    });

    app.post('/createPost', upload.single('image'), async (req, res) => {
        const { title, caption } = req.body;
        const image = req.file;

        try {
            let imageData = {}; // 이미지 데이터를 저장할 객체 생성

            // 이미지가 전송된 경우에만 이미지 데이터 저장
            if (image) {
                imageData = { image: '/uploads/' + image.filename };
            }

            // MongoDB에 게시글 정보 저장
            await mydb.collection('post').insertOne({
                title: title,
                caption: caption,
                ...imageData // 이미지 데이터 객체 병합
            });

            res.redirect('/main'); // 게시물이 성공적으로 작성되면 메인 페이지로 이동
        } catch (err) {
            console.log('Failed to create post:', err);
            res.status(500).send('게시물 작성에 실패했습니다.');
        }
    });

    app.post('/deletemongo', async (req, res) => {
        const postId = req.body._id;
        try {
            // MongoDB에서 해당 ID의 게시물 삭제
            await mydb.collection('post').deleteOne({ _id: new ObjectId(postId) }); // ObjectId 생성자 호출 수정
            res.status(200).send('게시물이 성공적으로 삭제되었습니다.');
        } catch (err) {
            console.log('Failed to delete post:', err);
            res.status(500).send('게시물 삭제에 실패했습니다.');
        }
    });

    // 이미지 업로드 엔드포인트
    app.post('/upload', upload.single('image'), function(req, res) {
        if (!req.file) {
            return res.status(400).send('이미지를 업로드하지 못했습니다.');
        }
        res.status(200).send('이미지가 성공적으로 업로드되었습니다.');
    });

    // 서버 측의 코드 수정
    app.post('/update', upload.single('image'), async (req, res) => {
        const postId = req.body._id;
        const newTitle = req.body.title;
        const newCaption = req.body.caption;
        const newImage = req.file;

        try {
            let updateData = {
                title: newTitle,
                caption: newCaption
            };

            // 새로운 이미지가 전송된 경우에만 이미지 데이터 저장
            if (newImage) {
                updateData.image = '/uploads/' + newImage.filename;
            }

            // MongoDB에서 해당 ID의 게시물을 찾아 제목, 내용, 이미지를 업데이트
            await mydb.collection('post').updateOne(
                { _id: new ObjectId(postId) },
                { $set: updateData }
            );
            res.redirect('/main');
        } catch (err) {
            console.log('Failed to update post:', err);
            res.status(500).send('게시물 수정에 실패했습니다.');
        }
    });

    app.get('/sujung', function (req, res) {
        const { postId, title, caption, image } = req.query;

        // 수신한 데이터를 로그로 출력
        console.log(`Received data - Post ID: ${postId}, Title: ${title}, Caption: ${caption}, Image: ${image}`);

        // EJS 템플릿에 데이터 전달
        res.render('sujung', { postId, title, caption, image });
    });
}

module.exports = { setRoutes };
