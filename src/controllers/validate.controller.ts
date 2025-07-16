import { Request, Response } from 'express';

export const ValidateController = {
    async AuthValidator(req: Request, res: Response) {
        console.log('validate');
        res.setHeader('X-WEBAUTH-USER', 'test');
        res.status(200).send('OK');
        // if (!req.auth) {
        //     res.status(401).send('Unauthorized');
        // } else {
        //     const username = req.auth.sub || req.auth.username;
        //     if (!username) {
        //         res.status(400).send('Username not found in token');
        //     } else {
        //         res.setHeader('X-WEBAUTH-USER', username);
        //         res.status(200).send('OK');
        //     }
        // }
    }
}