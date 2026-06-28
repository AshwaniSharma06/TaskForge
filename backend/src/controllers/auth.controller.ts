import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../services/prisma';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Simulating email verification code (6 digit numeric code)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        verificationToken: verificationCode,
        isVerified: false,
      }
    });

    console.log(`\n======================================================`);
    console.log(`[SIMULATED EMAIL SERVICE]`);
    console.log(`To: ${email}`);
    console.log(`Subject: Verify your TaskForge Account`);
    console.log(`Body: Your email verification code is: ${verificationCode}`);
    console.log(`======================================================\n`);

    res.status(201).json({
      message: 'Registration successful. A verification code has been sent to your email (simulated in console).',
      email: user.email,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    if (user.verificationToken !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationToken: null,
      }
    });

    const token = generateToken({ userId: user.id, email: user.email });

    res.status(200).json({
      message: 'Email verified successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      // Re-trigger verification code simulation
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.user.update({
        where: { email },
        data: { verificationToken: verificationCode }
      });

      console.log(`\n======================================================`);
      console.log(`[SIMULATED EMAIL SERVICE - RE-VERIFICATION]`);
      console.log(`To: ${email}`);
      console.log(`Subject: Verify your TaskForge Account`);
      console.log(`Body: Your email verification code is: ${verificationCode}`);
      console.log(`======================================================\n`);

      return res.status(403).json({
        error: 'Email is not verified.',
        emailNotVerified: true,
        email: user.email
      });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User with this email does not exist' });
    }

    // Generate numeric code reset token
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: resetCode,
        resetTokenExpires: expires
      }
    });

    console.log(`\n======================================================`);
    console.log(`[SIMULATED EMAIL SERVICE - PASSWORD RESET]`);
    console.log(`To: ${email}`);
    console.log(`Subject: Reset your TaskForge Password`);
    console.log(`Body: Your password reset code is: ${resetCode}`);
    console.log(`======================================================\n`);

    res.status(200).json({
      message: 'Password reset code has been sent to your email (simulated in console).'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.resetToken || user.resetToken !== code) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
      return res.status(400).json({ error: 'Reset code has expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      }
    });

    res.status(200).json({
      message: 'Password reset successful. You can now login.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
