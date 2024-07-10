require('dotenv').config()
const User = require("../entities/User")
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const Tokens = require('../entities/Tokens')

const UserControl = {
    find: {
        async getUserByName(nome) {
            try {
                return await User.findOne({
                    where: {
                        nome
                    }
                })
            } catch (error) {
                throw error
            }

        },
        async getById(req, res) {
            const { id } = req.params;
            try {
                const UserInstance = await User.findByPk(id, {
                    attributes: {
                        exclude: ['password']
                    }
                })
                return res.json(UserInstance)
            } catch (error) {
                res.status(500).json({ error: 'Erro ao procurar User - ' + error.message })
            }
        },
        async getToken(token) {
            try {
                return await Tokens.findOne({
                    where: {
                        token
                    }
                })
            } catch (error) {
                throw error
            }
        }
    },

    gerarToken(user) {
        return jwt.sign({
            id: user.id,
            nome: user.nome,
            tipo: user.tipo
        }, process.env.JWT_SECRET)
    },

    meusDados(req, res) {
        const userLogged = req.user;
        if (!userLogged) {
            return res.status(401).json({ msg: "Unauthorized" });
        }

        return res.status(200).json({ user: userLogged });
    },

    async getAll(req, res) {
        try {
            res.json(await User.findAll({
                attributes: {
                    exclude: ['password']
                }
            }))
        } catch (error) {
            res.status(500).json({
                error: 'Erro ao buscar os Users - ' + error.message,
                name: error.name,
                stack: error.stack
            })
        }
    },

    async save(req, res) {
        const { nome, password } = req.body
        const ultimoIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress
        try {
            const user = await UserControl.find.getUserByName(nome)
            if (user) {
                res.status(400).json({ msg: "Nome de usuário já existe" })
            } else {
                const userData = {
                    nome: nome,
                    password: await bcrypt.hash(password, 10),
                    ultimoIp
                }
                const UserInstance = await User.create(userData)
                const token = UserControl.gerarToken(UserInstance)

                res.status(201).json({
                    msg: 'Usuário cadastrado e logado com sucesso!',
                    token: token
                });
            }

        } catch (error) {
            res.status(500).json({
                error: 'Erro ao salvar User - ' + error.message,
                name: error.name,
                stack: error.stack
            })
        }
    },

    async login(req, res) {
        const { nome, password } = req.body;
        if (!nome || !password) {
            return res.status(400).json({ msg: 'Dados obrigatórios não foram preenchidos' })









            
        }

        try {
            const user = await UserControl.find.getUserByName(nome);
            if (user) {
                const senha_ok = await bcrypt.compare(password, user.password);
                if (senha_ok) {
                    const token = UserControl.gerarToken(user)

                    const tokenInvalidExists = await UserControl.find.getToken(token)
                    if (tokenInvalidExists) {
                        return res.status(400).json({ msg: 'Token já está inválido' });
                    }

                    return res.status(200).json({ msg: "Usuário logado com sucesso!", token: token });
                } else {
                    return res.status(400).json({ error: "Nome ou Senha incorretos!" });
                }
            } else {
                return res.status(404).json({ error: "Usuário não encontrado!" });
            }
        } catch (error) {
            return res.status(400).json(error);
        }
    },

    async logout(req, res) {
        try {
            const { authorization } = req.headers;
            if (!authorization) {
                return res.status(400).json({ msg: "Token não fornecido" });
            }

            const token = authorization.split(' ')[1];
            const tokenInvalidExists = await UserControl.find.getToken(token);

            if (!tokenInvalidExists) {
                await Tokens.create({
                    token
                });
            }

            res.status(200).json({ msg: "Logout realizado com sucesso!" })

        } catch (error) {
            return res.status(500).json({ msg: "Erro ao processar logout", erro: error.message });
        }
    },

    //arquivo nesta função
    async update(req, res) {
        const { id } = req.params;
        const userLogged = req.user;
        const { nome, password } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        if (!userLogged || id != userLogged.id) {
            return res.status(401).json({ msg: "Unauthorized" });
        }

        try {
            const UserInstance = await User.findByPk(userLogged.id);
            if (!UserInstance) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const updatedData = {};
            if (nome) {
                updatedData.nome = nome;
            }
            if (password) {
                updatedData.password = await bcrypt.hash(password, 10);
            }

            updatedData.ip = ip;

            await UserInstance.update(updatedData);

            if (nome) {
                await UserControl.logout(req, res)
            } else {
                res.status(200).send({ msg: 'Usuário atualizado com sucesso!' });
            }

        } catch (error) {
            res.status(500).json({
                error: 'Erro ao atualizar User - ' + error.message,
                name: error.name,
                stack: error.stack
            });
        }
    },

    async delete(req, res) {
        const { id } = req.body;

        const UserInstance = await User.findByPk(id);
        try {

            if (!UserInstance) {
                return req.status(404).json({
                    error: 'Não existe a User'
                })
            }
            await UserInstance.destroy();
            res.status(201).json({ message: 'User deletado' });
        } catch (error) {
            res.status(500).json({
                error: 'erro ao deletar - ' + error.message,
                name: error.name,
                stack: error.stack
            })
        }
    }
}

module.exports = UserControl;