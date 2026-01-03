const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const app = express();
app.use(express.json());

// Mock de tes fonctions et modules
jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        verifyIdToken: jest.fn().mockResolvedValue({
          getPayload: () => ({
            email: 'test@example.com',
            name: 'Test User',
            sub: 'google123',
            picture: 'https://example.com/avatar.png'
          })
        })
      };
    })
  };
});

const getUserByEmail = jest.fn();
const getUserById = jest.fn();
const createUser = jest.fn();
const saveRefreshToken = jest.fn();

const JWT_SECRET = 'testsecret';
const JWT_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Fonctions de création de token
function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

// Contrôleur
const loginWithGoogle = async (req, res, next) => {
  try {
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).json({ error: 'Token ID requis' });

    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client('dummy-client-id');
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: 'dummy-client-id',
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    let user = await getUserByEmail(email);
    if (!user) {
      const userId = await createUser({ name, email, password: 'random', role: 'user', avatar_url: picture });
      user = await getUserById(userId);
    }

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });
    await saveRefreshToken(user.id, refreshToken);

    return res.status(200).json({
      message: 'Connexion Google réussie ✅',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// Route
router.post('/google', loginWithGoogle);
app.use('/auth', router);

// --- TESTS ---
describe('POST /auth/google', () => {
  beforeEach(() => {
    getUserByEmail.mockReset();
    getUserById.mockReset();
    createUser.mockReset();
    saveRefreshToken.mockReset();
  });

  it('devrait retourner 400 si tokenId manquant', async () => {
    const res = await request(app).post('/auth/google').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Token ID requis');
  });

  it('devrait créer un nouvel utilisateur si non existant et retourner tokens', async () => {
    getUserByEmail.mockResolvedValue(null);        // utilisateur non existant
    createUser.mockResolvedValue('user123');       // ID du nouvel utilisateur
    getUserById.mockResolvedValue({               // infos utilisateur créé
      id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user'
    });

    const res = await request(app).post('/auth/google').send({ tokenId: 'dummy-token' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Connexion Google réussie ✅');
    expect(res.body.user).toEqual({
      id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user'
    });
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('devrait utiliser un utilisateur existant si trouvé', async () => {
    getUserByEmail.mockResolvedValue({
      id: 'existingUser',
      name: 'Existing User',
      email: 'test@example.com',
      role: 'user'
    });

    const res = await request(app).post('/auth/google').send({ tokenId: 'dummy-token' });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.id).toBe('existingUser');
  });
});
