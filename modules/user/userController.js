const User = require('./userModel');
const bcrypt = require('bcryptjs');

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
            req.flash('error', 'E-mail/Usuário ou senha incoretos');
            return res.redirect('/login');
        }
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email
        };
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
            updateData.porfilePicture = req.file.filename;
        }

        await User.update(updateData, { where: { id: userId } });

        req.flash('sucess', 'Perfil atualizado com sucesso!');
        res.redirect('/profile.edit');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Erro ao atualizar perfil.');
        res.redirect('/profile/edit');
    }
}