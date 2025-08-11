// src/router/index.js
import {createRouter, createWebHistory} from 'vue-router';
import Order from '../views/Orders.vue';
import Settle from '../views/Settle.vue';
import Wechat from '../views/Wchat.vue';

const routes = [
    {path: '/inner', component: Order},
    {path: '/settle', component: Settle},
    {path: '/query', component: Settle},
    {path: '/wechat', component: Wechat}
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
