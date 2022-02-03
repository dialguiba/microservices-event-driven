/* export const n: number = 5;
console.log(n);
import 'dotenv/config';
console.log(process.env.MSG);
 */

import * as express from 'express';
import { Request, Response } from 'express';
import * as cors from 'cors';
import { createConnection } from 'typeorm';

import { Product } from './entity/product';

import * as amqp from 'amqplib/callback_api';

createConnection().then((db) => {
  const productRespository = db.getRepository('Product');

  amqp.connect(
    'amqps://tufrbcow:OiPxSUptiGJAI76B7nXt_SV-bK2TJzOy@bonobo.rmq.cloudamqp.com/tufrbcow',
    (error0, connection) => {
      if (error0) {
        throw error0;
      }

      connection.createChannel((error1, channel) => {
        if (error1) {
          throw error1;
        }

        const app = express();

        app.use(
          cors({
            origin: [
              'http://localhost:3000',
              'http://localhost:8080',
              'http://localhost:4200',
            ],
          })
        );

        app.use(express.json());

        app.get('/api/products', async (req: Request, res: Response) => {
          const products = await productRespository.find();
          res.json(products);
        });

        app.post('/api/products', async (req: Request, res: Response) => {
          const product = await productRespository.create(req.body);
          const result = await productRespository.save(product);
          channel.sendToQueue(
            'product_created',
            Buffer.from(JSON.stringify(result))
          );
          return res.send(result);
        });

        app.get('/api/products/:id', async (req: Request, res: Response) => {
          const product = await productRespository.findOne(req.params.id);
          return res.json(product);
        });

        app.put('/api/products/:id', async (req: Request, res: Response) => {
          console.log(req.params.id);
          const product = await productRespository.findOne(req.params.id);
          productRespository.merge(product, req.body);
          const result = await productRespository.save(product);
          channel.sendToQueue(
            'product_updated',
            Buffer.from(JSON.stringify(result))
          );
          return res.send(result);
        });

        app.delete('/api/products/:id', async (req: Request, res: Response) => {
          const result = await productRespository.delete(req.params.id);
          channel.sendToQueue('product_deleted', Buffer.from(req.params.id));
          return res.send(result);
        });

        app.post(
          '/api/products/:id/like',
          async (req: Request, res: Response) => {
            const product = (await productRespository.findOne(
              req.params.id
            )) as Product;
            product.likes++;
            const result = await productRespository.save(product);
            return res.send(result);
          }
        );

        app.listen(8000, () => console.log('SERVER IN PORT 8000'));
        process.on('beforeExit', () => {
          console.log('closing');
          connection.close();
        });
      });
    }
  );
});
