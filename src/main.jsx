import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, Navigate, RouterProvider, Outlet } from "react-router-dom";
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
import Mapfeed from './adminside/Map/mapfeed';
import Cetagory from './adminside/Category/Category';
import AuthProvider from './userside/Provider/AuthProvider';
import AddSocial from './adminside/Social/Addsocial';
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
import ErrorPage from './userside/ErrorPage/ErrorPage';
import { PageShimmer, RouteLoadingBar } from './userside/utils/Shimmer';

// Wraps every route: shows a top loading bar while the next page's data loads.
const RootLayout = () => (
  <>
    <RouteLoadingBar />
    <Outlet />
  </>
);
import AdminPortfoilo from './adminside/Portfolio/portfolio';
import { HelmetProvider } from 'react-helmet-async'
import PaymentMethod from './adminside/PaymentMethod/paymentmethod';
import PComments from './adminside/Comments/Comments';
import EventAnalytics from './adminside/EventAnalytics/EventAnalytics';
import CustomProjects from './adminside/Projects/CustomProjects';
import Mail from './adminside/Mail/Mail';
import EditPackage from './adminside/AddPackages/EditPackage';
import Applications from './adminside/Applications/Applications';
import Blog from './adminside/Blogs/Blogs';
import BlogDetails from './adminside/Blogs/BlogDetails';
import BlogList from './adminside/Blogs/Bloglist';
import BlogsPage from './adminside/Blogs/Blogspage';
import TaskDashboard from './adminside/workdis/taskdeashboard';

const router = createBrowserRouter([
  {
  element: <RootLayout />,
  errorElement: <ErrorPage />,
  children: [
  {
    path: "/admin",
    element: <Admin />,
    children: [
      {
        index: true,        // renders at /admin
        element: <Home />,  // your dashboard
      },
    ],
  },
  {
    path: "/admin/login",
    element: <ASignin />,
  },

  {
    path: "/",
    element: <Admin />,

    children: [
      {
        index: true,      
        element: <Home />,  
      },
      {
        path: "/admin",
        element: <Home></Home>
      },
      {
        path: "/admin/projects",
        element: <Projects></Projects>,
        loader: () => fetch(`${base_url}/orders`),
      },
      {
        path: "/admin/add-pack",
        element: <AddPackages></AddPackages>
      },
      {
        path: "/admin/packageupdate/:id",
        element: <EditPackage></EditPackage>,
      },
      {
        path: "/admin/pack-stat",
        element: <PackStat></PackStat>,
        loader: () => fetch(`${base_url}/packages`),

      },
      {
        path: "/admin/customprojects",
        element: <CustomProjects></CustomProjects>,

      },

      {
        path: "/admin/hclients",
        element: <AllHClient></AllHClient>,
      },
      {
        path: "/admin/faq",
        element: <Faqall></Faqall>,
      },
      {
        path: "/admin/team",
        element: <Teamadmin></Teamadmin>,

      },
      {
        path: "/admin/cetagory",
        element: <Cetagory></Cetagory>,
        loader: () => fetch(`${base_url}/category`),
      },
      {
        path: "/admin/service",
        element: <Service></Service>,
      },
      {
        path: "/admin/reviews",
        element: <Reviews></Reviews>,
        loader: () => fetch(`${base_url}/review`),

      },
      {
        path: "/admin/coupons",
        element: <Coupon></Coupon>,
      },
      {
        path: "/admin/marketing",
        element: <Marketing></Marketing>,
      },
      {
        path: "/admin/map",
        element: <Mapfeed></Mapfeed>,
      },
      {
        path: "/admin/clientlist",
        element: <Clientlist></Clientlist>,

      },
      {
        path: "/admin/employeelist",
        element: <Employeelist></Employeelist>,
        loader: () => fetch(`${base_url}/employees`),
      },
      {
        path: "/admin/adminlist",
        element: <Adminlist></Adminlist>,

      },
      {
        path: "/admin/recruitment",
        element: <RecruitmentAdmin></RecruitmentAdmin>,

      },
      {
        path: "/admin/applications",
        element: <Applications></Applications>,

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
        path: "/admin/eventanalytics",
        element: <EventAnalytics></EventAnalytics>,
      },
      {
        path: "/admin/flowmaker",
        element: <Flowmaker></Flowmaker>,
      },
      {
        path: "/admin/allflows",
        element: <Allflows></Allflows>,

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
      },
      {
        path: "/admin/planform/:id",
        element: <FormPage />,
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
        path: "/admin/taskdashboard",
        element: <TaskDashboard></TaskDashboard>,

      },
      {
        path: "/admin/workdistribution",
        element: <WorkDis></WorkDis>,
        loader: () => fetch(`${base_url}/alltasks`),

      },
      {
        path: "/admin/income",
        element: <Income></Income>,

      },
      {
        path: "/admin/expense",
        element: <Expense></Expense>,

      },
      {
        path: "/admin/advertisement",
        element: <Advertise></Advertise>,
      },
      {
        path: "/admin/support",
        element: <AdminSupport></AdminSupport>,
      },
      {
        path: "/admin/mail",
        element: <Navigate to="/admin/mail/inbox" replace />
      },
      {
        path: "/admin/mail/:folder",
        element: <Mail />
      },
      // Old Email Manager links
      {
        path: "/admin/emailmanager",
        element: <Navigate to="/admin/mail/sent" replace />
      },
      {
        path: "/admin/emailinbox",
        element: <Navigate to="/admin/mail/inbox" replace />
      },

 {
        path: "/admin/blogs",
        element: <Blog />
      },
{
        path: "/blogs",
        element: <BlogsPage />
      },
      {
        path: "/blog/:slug",
        element: <BlogDetails />
      },
       {
        path: "blogs/:slug",
        element: <BlogsPage />
      },

     
      {
        path: "/admin/portfolio",
        element: <AdminPortfoilo></AdminPortfoilo>,
      },

    ],
  },

  { path: "*", element: <ErrorPage /> },
  ],
  },
],
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        {/* ← moved here, renders on every page */}
        <RouterProvider router={router} fallbackElement={<PageShimmer />} />
      </AuthProvider>
    </HelmetProvider>

  </React.StrictMode>,
)
