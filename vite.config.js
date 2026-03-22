// vite.config.js  ── replace your existing vite.config.js
// Run first: npm install vite-plugin-sitemap --save-dev

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sitemap from 'vite-plugin-sitemap'

const SITE_URL = 'https://cloudcompany.cc'

// All public-facing static routes from your router
const staticRoutes = [
  '/',
  '/aboutus',
  '/ourteam',
  '/portfolio',
  '/career',
  '/signin',
  '/clientsignin',
  '/clientsignup',
  '/buypackage',
]

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: SITE_URL,
      dynamicRoutes: staticRoutes,

      // All admin, employee, and private routes — keep out of Google
      exclude: [
        '/admin',
        '/admin/login',
        '/admin/projects',
        '/admin/add-pack',
        '/admin/pack-stat',
        '/admin/hclients',
        '/admin/faq',
        '/admin/team',
        '/admin/cetagory',
        '/admin/service',
        '/admin/reviews',
        '/admin/coupons',
        '/admin/marketing',
        '/admin/map',
        '/admin/clientlist',
        '/admin/employeelist',
        '/admin/adminlist',
        '/admin/recruitment',
        '/admin/social',
        '/admin/flowmaker',
        '/admin/allflows',
        '/admin/planner',
        '/admin/planslist',
        '/admin/planresponses',
        '/admin/workdistribution',
        '/admin/income',
        '/admin/expense',
        '/admin/advertisement',
        '/admin/support',
        '/admin/portfolio',
        '/client',
        '/requireddetails',
        '/employeesignup',
        '/employeeprofile/:id',
        '/clientprofile/:id',
        '/marketerprofile/:id',
        '/admin/editplanner/:id',
        '/admin/planform/:id',
      ],

      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date(),
    }),
  ],
})