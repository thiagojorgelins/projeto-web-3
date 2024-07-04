const express = require('express')
const router = express.Router();

const AnswerControl = require('../controllers/AnswerControl');
const BoardControl = require('../controllers/BoardControl');
const ThreadControl = require('../controllers/ThreadControl')
const UserControl = require('../controllers/UserControl');
const { adminAuth, userAuth } = require('../auth/auth');

//answer
router.get('/respostas/', AnswerControl.getAll);
router.get('/respostas/:id', AnswerControl.getById);
router.post('/respostas/', userAuth, AnswerControl.save);
router.put('/respostas/', userAuth, AnswerControl.update);
router.delete('/respostas/', userAuth, AnswerControl.delete);

//board
router.get('/boards/', BoardControl.getAll);
router.get('/boards/:id', BoardControl.getById);
router.post('/boards/', adminAuth, BoardControl.save);
router.put('/boards/', adminAuth, BoardControl.update);
router.delete('/boards/', adminAuth, BoardControl.delete);

//Thread
router.get('/threads/', ThreadControl.getAll);
router.get('/threads/:id', ThreadControl.getById);
router.post('/threads/', userAuth, ThreadControl.save);
router.put('/threads/', userAuth, ThreadControl.update);
router.delete('/threads/', userAuth, ThreadControl.delete);

//User
router.get('/users/', userAuth, UserControl.getAll);
router.get('/users/:id', userAuth, UserControl.find.getById);
router.get('/me', userAuth, UserControl.meusDados);
router.post('/users/', UserControl.save);
router.post('/login', UserControl.login)
router.post('/logout', userAuth, UserControl.logout)
router.patch('/users/:id', userAuth, UserControl.update);
router.delete('/users/', userAuth, UserControl.delete);


module.exports = router;