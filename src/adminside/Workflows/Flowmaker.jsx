import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import RichTextEditor from '../../userside/utils/PichTextEditor';
import { base_url } from "../../config/config";
const API_BASE = `${base_url}`;

const Field = ({ label, children }) => (
  <label className="flex flex-col text-sm w-full border-1">
    <span className="mb-1 font-medium">{label}</span>
    {children}
  </label>
);

const TaskRowEditor = ({
  task,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  departmentData,
  subdepartmentData,
}) => {
  // Local states for each task
  const [department, setDepartment] = useState(task.rdep || "");
  const [subDep, setSubDep] = useState(task.rsubdep || "");
  const [expertise, setExpertise] = useState(task.esprts || "");
  const [availableExpertise, setAvailableExpertise] = useState([]);

  useEffect(() => {
    setSubDep("");
    setExpertise("");
  }, [department]);

  useEffect(() => {
    setAvailableExpertise(subdepartmentData[subDep] || []);
    setExpertise("");
  }, [subDep]);

  // Update task parent state
  const update = (patch) => {
    onChange({
      ...task,
      ...patch,
      rdep: department,
      rsubdep: subDep,
      esprts: expertise,
    });
  };

  return (
    <div className="p-3 border rounded-md mb-4 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Order: {task.order}</div>

        <div className="flex gap-2">
          <button onClick={onMoveUp} className="text-xs border px-2 py-1 rounded">↑</button>
          <button onClick={onMoveDown} className="text-xs border px-2 py-1 rounded">↓</button>
          <button onClick={onRemove} className="text-red-500 hover:underline text-xs">Remove</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">

        {/* Task Name */}
        <Field label="Task Name">
          <input
            value={task.tname}
            onChange={(e) => update({ tname: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </Field>

        {/* Department */}
        <div className="relative">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select Department</option>
            {departmentData.map((dep) => (
              <option key={dep.department} value={dep.department}>
                {dep.department}
              </option>
            ))}
          </select>
        </div>

        {/* Sub Department */}
        <div className="relative">
          <select
            value={subDep}
            disabled={!department}
            onChange={(e) => setSubDep(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select Sub Department</option>
            {departmentData
              .find((dep) => dep.department === department)
              ?.subDepartments.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
          </select>
        </div>

        {/* Expertise */}
        <div className="relative">
          <select
            value={expertise}
            disabled={!subDep}
            onChange={(e) => setExpertise(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select Expertise</option>
            {availableExpertise.map((exp) => (
              <option key={exp} value={exp}>{exp}</option>
            ))}
          </select>
        </div>

        {/* Estimated Time */}
        <Field label="Estimated Time (hours)">
          <input
            type="number"
            min={0}
            value={task.ttime}
            onChange={(e) => update({ ttime: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </Field>

        {/* Allocated CC */}
        <Field label="Allocated CC">
          <input
            type="number"
            min={0}
            value={task.tcc}
            onChange={(e) => update({ tcc: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </Field>
      </div>

      {/* Task Description */}
      <RichTextEditor
        name="tdesc"
        value={task.tdesc}
        onChange={(value) => update({ tdesc: value })}
      />
    </div>
  );
};

export default function FlowMaker({ initial = null, onSaved = () => {} }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [packageId, setPackageId] = useState(initial?.packageId || "");
  const [tasks, setTasks] = useState(initial?.flow || []);
  const [loading, setLoading] = useState(false);

  const departmentData = [
    { department: "Web Development", subDepartments: ["Frontend", "Backend", "Full Stack", "CMS Development"] },
    { department: "Graphic Design", subDepartments: ["Social Media Design", "Post Design", "Logo Design", "UI/UX Design", "Print Design"] },
    { department: "Digital Marketing", subDepartments: ["Cloud Company Marketing", "SEO", "Social Media Marketing", "Content Marketing", "Email Marketing", "Paid Ads (PPC)"] },
    { department: "Mobile App Development", subDepartments: ["Android Development", "iOS Development", "Cross-Platform Development"] },
    { department: "Video & Animation", subDepartments: ["2D Animation", "3D Animation", "Explainer Videos", "Video Editing", "Motion Graphics"] },
    { department: "Content Writing", subDepartments: ["Blog Writing", "Copywriting", "Technical Writing", "Product Descriptions"] },
    { department: "Data & Analytics", subDepartments: ["Data Analysis", "Data Visualization", "Machine Learning", "AI Model Training"] },
    { department: "IT & Support", subDepartments: ["Server Management", "Cloud Support", "Networking", "Technical Support"] },
  ];

  const subdepartmentData = {
    Frontend: ["React", "Angular", "Vue.js", "Next.js", "Tailwind CSS"],
    Backend: ["Laravel", "Node.js", "PHP", "Python", "Express.js"],
    "Full Stack": ["MERN Stack", "MEAN Stack", "LAMP Stack"],
    "CMS Development": ["WordPress", "Shopify", "Wix", "Joomla"],

    "Social Media Design": ["DP", "Cover", "Instagram Posts", "Story Templates"],
    "Post Design": ["Banner", "Flyer", "Poster", "Brochure"],
    "Logo Design": ["Logo Creation", "Branding", "Icon Design"],
    "UI/UX Design": ["Wireframing", "Prototyping", "Figma", "Adobe XD"],
    "Print Design": ["Business Cards", "Letterheads", "Magazine Layouts"],

    SEO: ["On-Page SEO", "Off-Page SEO", "Keyword Research", "Technical SEO"],
    "Social Media Marketing": ["Facebook Ads", "Instagram Growth", "LinkedIn Marketing"],
    "Content Marketing": ["Blog Strategy", "Content Planning", "Copy Optimization"],
    "Email Marketing": ["Mailchimp", "Automation", "Cold Outreach"],
    "Paid Ads (PPC)": ["Google Ads", "YouTube Ads", "Facebook Ads"],

    "Android Development": ["Kotlin", "Java", "Android Studio"],
    "iOS Development": ["Swift", "Objective-C", "Xcode"],
    "Cross-Platform Development": ["Flutter", "React Native", "Ionic"],

    "2D Animation": ["Character Animation", "Explainer Animations"],
    "3D Animation": ["Modeling", "Rendering", "Rigging"],
    "Explainer Videos": ["Storyboard", "Voice Over", "Motion Graphics"],
    "Video Editing": ["Premiere Pro", "After Effects", "DaVinci Resolve"],
    "Motion Graphics": ["Text Animation", "Logo Animation", "Transitions"],

    "Blog Writing": ["SEO Blogs", "Technical Blogs", "Long-form Articles"],
    Copywriting: ["Sales Copy", "Website Copy", "Ad Copy"],
    "Technical Writing": ["API Docs", "Software Manuals", "User Guides"],
    "Product Descriptions": ["E-commerce Copy", "Amazon Listings"],

    "Data Analysis": ["Excel", "Python", "Power BI", "SQL"],
    "Data Visualization": ["Tableau", "Google Data Studio", "D3.js"],
    "Machine Learning": ["TensorFlow", "Scikit-learn", "Keras"],
    "AI Model Training": ["Data Labeling", "Model Tuning", "Evaluation"],

    "Server Management": ["Linux", "cPanel", "AWS EC2"],
    "Cloud Support": ["AWS", "Azure", "Google Cloud"],
    Networking: ["Cisco", "Network Setup", "Troubleshooting"],
    "Technical Support": ["Remote Support", "System Maintenance", "Bug Fixing"],
  };

  // Set order on initial load
  useEffect(() => {
    setTasks((t) => t.map((item, i) => ({ ...item, order: i + 1 })));
  }, []);

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        order: tasks.length + 1,
        tname: "",
        tdesc: "",
        rdep: "",
        rsubdep: "",
        esprts: "",
        ttime: 0,
        tcc: 0,
      },
    ]);
  };

  const updateTask = (index, updated) => {
    const copy = [...tasks];
    copy[index] = updated;
    copy.forEach((t, i) => (t.order = i + 1));
    setTasks(copy);
  };

  const removeTask = (index) => {
    const filtered = tasks.filter((_, i) => i !== index);
    filtered.forEach((t, i) => (t.order = i + 1));
    setTasks(filtered);
  };

  const moveTask = (from, to) => {
    if (to < 0 || to >= tasks.length) return;
    const arr = [...tasks];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    arr.forEach((t, i) => (t.order = i + 1));
    setTasks(arr);
  };

  const saveToAPI = async (payload) => {
    setLoading(true);

    try {
      const url = initial?._id
        ? `${API_BASE}/taskflow/${initial._id}`
        : `${API_BASE}/taskflows`;

      const method = initial?._id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success || data.insertedId) {
        Swal.fire("Success!", "Task flow saved successfully.", "success");
        onSaved(payload);
      } else {
        Swal.fire("Error", "Could not save template.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Server error while saving template.", "error");
    }

    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    saveToAPI({
      title,
      packageId,
      flow: tasks,
    });
  };

  return (
    <div className="w-full">
      <div className="hdr">Create Task Flow</div>

      <div className="p-10">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Title + Package */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Template Title">
              <input
                value={title}
                required
                onChange={(e) => setTitle(e.target.value)}
                className="p-2 border rounded w-full"
              />
            </Field>

            <Field label="Package ID">
              <input
                value={packageId}
                required
                onChange={(e) => setPackageId(e.target.value)}
                className="p-2 border rounded w-full"
              />
            </Field>
          </div>

          {/* Tasks List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Tasks ({tasks.length})</h3>
              <button
                type="button"
                onClick={addTask}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Add Task
              </button>
            </div>

            {tasks.length === 0 && (
              <p className="text-sm text-gray-500">No tasks yet — click Add Task.</p>
            )}

            {tasks.map((task, i) => (
              <TaskRowEditor
                key={i}
                task={task}
                onChange={(t) => updateTask(i, t)}
                onRemove={() => removeTask(i)}
                onMoveUp={() => moveTask(i, i - 1)}
                onMoveDown={() => moveTask(i, i + 1)}
                departmentData={departmentData}
                subdepartmentData={subdepartmentData}
              />
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Template"}
            </button>

            <button
              type="button"
              onClick={() => {
                setTitle("");
                setPackageId("");
                setTasks([]);
              }}
              className="border px-4 py-2 rounded"
            >
              Reset
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
