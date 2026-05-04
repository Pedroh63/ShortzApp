const User = require('./userModel');
const bcrypt = require('bcryptjs');
const fs = require("fs");
const path = require("path");

exports.register = async (req, res) => {
    const{ username, email, password, confirmPassword, fullname } = req.body;
    try {
        if(password !== confirmPassword) {
            req.flash('error', 'As senhas não coincidem.');
            return res.redirect('/register'); 
        }
        const emailExist = await User.findOne({ where: { email }});
        const usernameExist = await User.findOne({ where: { username }});
        if(emailExist || usernameExist) {
            req.flash('error', 'Este email ou usuário já está cadastrado');
            return res.redirect('/register');
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword =  await bcrypt.hash(password, salt);

        await User.create ({
            username,
            email,
            password: hashedPassword,
            fullname
        });
        req.flash('sucecss', 'Conta criada com sucesso! Faça seu login.');
        res.redirect('/login')
    } catch(error){
        console.error(error);
        req.flash('error', 'Erro ao criar a conta! Verifique os dadaos e tente novamente');
        res.redirect('/register');
    }

};
exports.login = async (req, res) => {
    try {
        const{ login, password } = req.body;
        const user = await User.findOne({
            where: {
                [require('sequelize').Op.or]: [{email: login},{username: login}]
            }
        });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            req.flash('error', 'E-mail/Usuário ou senha incorretos');
            return res.redirect('/login');
        }
        const userData = await this.getProfile(user.id);
        req.session.user = userData;

        res.redirect('/feed');
    }catch (error) {
        console.error(error);
        req.flash('error', 'Ocorreu um erro ao tentar entrar');
        res.redirect('/login');
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};
exports.getProfile = async (userId) => {
    try {
        const user = await User.findByPk(userId, {
            attributes: [ 'id', 'username', 'email', 'fullName', 'bio', 'profilePicture']
        });
        return user;
    } catch (error) {
        console.error(error);
        throw new Error('Erro ao buscar perfil do usuário.');
    }
};
exports.updateProfile = async(req, res) => {
    try {
        const { fullname, bio } = req.body;
        const userId = req.session.user.id;

        const updateData = { fullname, bio }

        if(req.file){
            updateData.profilePicture = req.file.filename;
        }
        const oldUser = await User.findByPk(userId);

        await User.update(updateData, { where: { id: userId } });
        if(req.file && oldUser.profilePicture !== 'default-profile.png') {
            const oldProfilePicPath = path.join(__dirname,'../../public/uploads/profiles', oldUser.profilePicture);
            fs.unlink(oldProfilePicPath, (err) => {
                if(err) console.error('Erro ao apagar foto de perfil antiga:', err);
                else console.log('Foto de perfil antiga apgada com sucesso:', oldProfilePicPath);   
            });
        }
        const userData = await this.getProfile(userId);
        req.session.user = userData;

        req.flash('sucess', 'Perfil atualizado com sucesso!');
        res.redirect('/profile/edit');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Erro ao atualizar perfil.');
        res.redirect('/profile/edit');
    }
}