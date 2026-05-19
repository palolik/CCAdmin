import { useEffect, useMemo, useState } from "react";
import { base_url } from "../../config/config";

const BlogJsxRenderer = ({ blog }) => {
  const [jsxCode, setJsxCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [iframeHeight, setIframeHeight] = useState(1200);

  useEffect(() => {
    if (!blog?.slug) return;

    setLoading(true);

    fetch(`${base_url}/blogjsx/${blog.slug}`)
      .then((res) => res.text())
      .then((code) => setJsxCode(code))
      .catch((error) => console.error("Error loading JSX:", error))
      .finally(() => setLoading(false));
  }, [blog?.slug]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "BLOG_IFRAME_HEIGHT") {
        setIframeHeight(Number(event.data.height || 1200) + 40);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const iframeHtml = useMemo(() => {
    if (!jsxCode || !blog) return "";

    const safeBlog = JSON.stringify(blog);
    const safeImages = JSON.stringify(blog.blogImages || []);
    const safeJsxCode = jsxCode.replace(/<\/script/gi, "<\\/script");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>

  <style>
    html,
    body,
    #root {
      width: 100%;
      min-width: 100%;
      min-height: 100%;
      margin: 0;
      padding: 0;
      background: #ffffff;
      overflow-x: hidden;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    img {
      max-width: 100%;
    }

    .prose h1 {
      font-size: 2.25rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .prose h2 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }

    .prose p {
      line-height: 1.8;
      color: #374151;
      margin-bottom: 1rem;
    }

    .prose ul {
      padding-left: 1.4rem;
      margin-bottom: 1rem;
      list-style: disc;
    }

    .prose li {
      margin-bottom: 0.5rem;
      color: #374151;
    }

    .prose blockquote {
      border-left: 4px solid #3b82f6;
      background: #eff6ff;
      padding: 1rem 1.25rem;
      border-radius: 0.75rem;
      color: #1e3a8a;
      margin: 2rem 0;
    }
  </style>
</head>

<body>
  <div id="root"></div>

  <script type="text/babel">
    const blog = ${safeBlog};
    const images = ${safeImages};

    const sendHeight = () => {
      setTimeout(() => {
        const height = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight
        );

        window.parent.postMessage({
          type: "BLOG_IFRAME_HEIGHT",
          height
        }, "*");
      }, 300);
    };

    try {
      ${safeJsxCode}

      if (typeof BlogPost === "undefined") {
        throw new Error("Your JSX file must define a component named BlogPost");
      }

      ReactDOM.createRoot(document.getElementById("root")).render(
        <BlogPost blog={blog} images={images} />
      );

      sendHeight();
      window.addEventListener("load", sendHeight);
      window.addEventListener("resize", sendHeight);
      setInterval(sendHeight, 1000);
    } catch (error) {
      document.getElementById("root").innerHTML =
        '<div style="padding:30px;color:#dc2626;font-family:Arial;">' +
        '<h2>Blog Render Error</h2>' +
        '<pre style="white-space:pre-wrap;">' + error.message + '</pre>' +
        '</div>';

      sendHeight();
    }
  </script>
</body>
</html>
`;
  }, [jsxCode, blog]);

  if (loading) {
    return (
      <div className="w-full py-20 text-center text-gray-400 bg-white rounded-2xl">
        Loading blog content...
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl bg-white">
      <iframe
        title={blog?.title || "Blog"}
        srcDoc={iframeHtml}
        sandbox="allow-scripts"
        style={{
          width: "100%",
          minWidth: "100%",
          maxWidth: "100%",
          height: `${iframeHeight}px`,
          border: "none",
          display: "block",
          background: "#ffffff",
        }}
      />
    </div>
  );
};

export default BlogJsxRenderer;