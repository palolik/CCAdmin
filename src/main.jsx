import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider, } from "react-router-dom";
import Admin from './adminside/admin';
import Home from './adminside/Home/Home';
import Projects from './adminside/Projects/Projects';
import AddPackages from './adminside/AddPackages/AddPackages';
import PackStat from './adminside/PackageStat/PackStat';
import Faqall from './adminside/faq/faq';
import Reviews from './adminside/reviews/reviews';
import Coupon from './adminside/Coupons/coupons';
import Service from './adminside/Service/Service';
import Teamadmin from './adminside/Team/Team';
import Mapfeed from './userside/userhome/map/mapfeed';
import Cetagory from './adminside/Category/Category';
import AuthProvider from './userside/Provider/AuthProvider';
// import ESignin from './userside/auth/ESignin';
import AddSocial from './adminside/Social/Addsocial';
// import OurClient from './adminside/OurClient/OurClient';
import WorkDis from './adminside/workdis/workdis';
import Adminlist from './adminside/Roles/adminlist/Adminlist';
import Employeelist from './adminside/Roles/employeelist/Employeelist';
import Clientlist from './adminside/Roles/clientlist/clientlist';
import ASignin from './adminside/Login/Login';
import Marketing from './adminside/marketing/Marketing';
import Expense from './adminside/Accounts/Expense/Expense';
import Income from './adminside/Accounts/Income/Income';
import Advertise from './adminside/Advertise/Advertise';
import RecruitmentAdmin from './adminside/Roles/recruitment/recruitments';
import AdminSupport from './adminside/AdminSupport/AdminSupport';
import Flowmaker from './adminside/Workflows/Flowmaker';
import Allflows from './adminside/Workflows/Allflows';
import Planner from './adminside/Businessplanner/Planner';
import Planlist from './adminside/Businessplanner/Planlist';
import Responses from './adminside/Businessplanner/Responses';
import EditPlanner from './adminside/Businessplanner/editplan';
import FormPage from './adminside/Businessplanner/Plannerform';
import AllHClient from './adminside/Clients/Clients';
import { base_url } from './config/config';
import AdminPortfoilo from './adminside/Portfolio/portfolio';

import { HelmetProvider } from 'react-helmet-async'

import PaymentMethod from './adminside/PaymentMethod/paymentmethod';
import PComments from './adminside/Comments/Comments';

import CustomProjects from './adminside/Projects/CustomProjects';
import EmailManager from './adminside/EmailManager/EMailManager';
import EmailInbox from './adminside/EmailManager/EmailLogs';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Admin></Admin>,
  },
 {
        path:"/admin/login",
        element: <ASignin></ASignin>
  },
  {
    path: "/admin",
    element: <Admin></Admin>,
    
    children: [
     
      {
        path:"/admin",
        element: <Home></Home>
      },
      {
        path:"/admin/projects",
        element: <Projects></Projects>,
        loader: ()=> fetch(`${base_url}/orders`),
      },
      {
        path:"/admin/add-pack",
        element: <AddPackages></AddPackages>
      },
      {
        path:"/admin/pack-stat",
        element: <PackStat></PackStat>,
        loader: ()=> fetch(`${base_url}/packages`),

      },
        {
        path:"/admin/customprojects",
        element: <CustomProjects></CustomProjects>,

      },
      
          {
        path:"/admin/hclients",
        element: <AllHClient></AllHClient>,
        loader: ()=> fetch(`${base_url}/hclient`),
      },
      {
        path:"/admin/faq",
        element: <Faqall></Faqall>,
        loader: ()=> fetch(`${base_url}/faq`),
      },
      {
        path:"/admin/team",
        element: <Teamadmin></Teamadmin>,
        loader: ()=> fetch(`${base_url}/team`),

      },
      {
        path:"/admin/cetagory",
        element: <Cetagory></Cetagory>,
        loader: ()=> fetch(`${base_url}/category`),
      },
      {
        path:"/admin/service",
        element: <Service></Service>,
      },
      {
        path:"/admin/reviews",
        element: <Reviews></Reviews>,
        loader: ()=> fetch(`${base_url}/clientfeedbacks`),

      },
        {
      path:"/admin/coupons",
      element: <Coupon></Coupon>,
      loader: ()=> fetch(`${base_url}/coupon`),
     },
      {
      path:"/admin/marketing",
      element: <Marketing></Marketing>,
      loader: ()=> fetch(`${base_url}/marketing`),
     },
     {
      path:"/admin/map",
      element: <Mapfeed></Mapfeed>,
      loader: ()=> fetch(`${base_url}/map`),
     },
      {
        path:"/admin/clientlist",
        element: <Clientlist></Clientlist>,
                 loader: ()=> fetch(`${base_url}/allclients`),

      },
      {
        path:"/admin/employeelist",
        element: <Employeelist></Employeelist>,
         loader: ()=> fetch(`${base_url}/employees`),

      }, 
      {
        path:"/admin/adminlist",
        element: <Adminlist></Adminlist>,
         loader: ()=> fetch(`${base_url}/roles`),

      },
        {
        path:"/admin/recruitment",
        element: <RecruitmentAdmin></RecruitmentAdmin>,
        loader: ()=> fetch(`${base_url}/recruitment`),

      },
   
      {
        path: "/admin/social",
        element: <AddSocial></AddSocial>,
      },
       {
        path: "/admin/comments",
        element: <PComments></PComments>,
      },
        {
        path: "/admin/flowmaker",
        element: <Flowmaker></Flowmaker>,
      },
        {
        path: "/admin/allflows",
        element: <Allflows></Allflows>,
                loader: ()=> fetch(`${base_url}/taskflows`),

      },
        {
        path: "/admin/planner",
        element: <Planner></Planner>,
      },
        {
        path: "/admin/planslist",
        element: <Planlist></Planlist>
      },
        {
      path: "/admin/editplanner/:id", 
      element: <EditPlanner />,
      loader: ({ params }) => fetch(`${base_url}/planner/${params.id}`),
    },
 {
      path: "/admin/planform/:id", 
      element: <FormPage />,
      loader: ({ params }) => fetch(`${base_url}/planner/${params.id}`),
    },
   
        {
        path: "/admin/planresponses",
        element: <Responses></Responses>,
      },
       {
        path: "/admin/paymentgate",
        element: <PaymentMethod></PaymentMethod>
      },
    
      {
        path: "/admin/workdistribution",
        element: <WorkDis></WorkDis>,
        loader: ()=> fetch(`${base_url}/alltasks`),

      },
        {
        path: "/admin/income",
        element: <Income></Income>,
        loader: ()=> fetch(`${base_url}/income`),

      },
        {
        path: "/admin/expense",
        element: <Expense></Expense>,
        loader: ()=> fetch(`${base_url}/expense`),

      },
        {
        path: "/admin/advertisement",
        element: <Advertise></Advertise>,
        loader: ()=> fetch(`${base_url}/advertise`),
        },
        {
        path: "/admin/support",
        element: <AdminSupport></AdminSupport>,
        loader: ()=> fetch(`${base_url}/adminsupport`),
        },
         {
        path: "/admin/emailmanager",
        element: <EmailManager></EmailManager>,
        },
{ path: "/admin/emailinbox",
   element: <EmailInbox /> },
 {
        path: "/admin/portfolio",
        element: <AdminPortfoilo></AdminPortfoilo>,
        loader: ()=> fetch(`${base_url}/getportfolio`),
        },

      ],},],

);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
       <HelmetProvider>
        <AuthProvider>
             {/* ← moved here, renders on every page */}
        <RouterProvider router={router} />
        </AuthProvider>
       </HelmetProvider>
  
    </React.StrictMode>,
)
