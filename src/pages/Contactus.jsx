import React, { useState, useEffect } from 'react';
import emailjs from 'emailjs-com';

const Contactus = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) {
      const t = setTimeout(() => setSubmitted(false), 10000);
      return () => clearTimeout(t);
    }
  }, [submitted]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Send notification to you
    emailjs.send(
        'service_oivrirq',    // Your service ID
        'template_4iauhsc',   // Your template ID
        form,
        'Y384_b61QrgVT3HCf'        // Your user/public key
    );

    // 2. Send auto-reply to user
    emailjs.send(
      'service_oivrirq',            // same service ID
      'template_1awhnn8',    // e.g. 'template_autoreply'
      form,
      'Y384_b61QrgVT3HCf'
    ).then(
      (result) => {
        setSubmitted(true);
      },
      (error) => {
        alert('Failed to send message. Please try again.');
      }
    );
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-neutral-900">
        <div className="bg-green-100 text-green-800 px-8 py-6 rounded-xl shadow text-2xl font-bold mt-20">
          Thank you for contacting us!
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-neutral-900">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-800 p-8 rounded-xl shadow-lg w-full max-w-md mt-20">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Contact Us</h2>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-200 mb-2">Name</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-2 border rounded bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-700" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-200 mb-2">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full px-4 py-2 border rounded bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-700" />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-200 mb-2">Message</label>
          <textarea name="message" value={form.message} onChange={handleChange} required rows={5} className="w-full px-4 py-2 border rounded bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-700" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition">Send Message</button>
      </form>
    </div>
  );
};

export default Contactus; 