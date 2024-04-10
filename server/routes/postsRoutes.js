const { Router } = require('express');
const { craetePost, getPosts, getPost, getCatPosts, getUsersPosts, editPost, deletePost }
    = require('../controllers/postControllers')

    const authMiddleware = require ("../middleware/authMiddleware")

const router = Router();

router.post('/',authMiddleware, craetePost)
router.get('/', getPosts)
router.get('/:id', getPost)
router.patch('/:id',authMiddleware, editPost)
router.get('/categories/:category', getCatPosts)
router.get('/users/:id', getUsersPosts)
router.delete('/:id',authMiddleware, deletePost)


module.exports = router;