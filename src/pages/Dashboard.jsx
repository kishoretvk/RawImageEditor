import React from 'react';

const Dashboard = ({ history, onReEdit, onExport }) => (
  <div className="min-h-screen bg-gray-100 text-gray-900 py-20">
    <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
    <div className="max-w-4xl mx-auto">
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th className="p-2 text-left">Filename</th>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Size</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item, idx) => (
            <tr key={idx} className="border-t">
              <td className="p-2">{item.filename}</td>
              <td className="p-2">{item.date}</td>
              <td className="p-2">{item.size}</td>
              <td className="p-2">
                <button className="bg-blue-600 text-white px-2 py-1 rounded mr-2" onClick={() => onReEdit(item)}>Re-Edit</button>
                <button className="bg-green-600 text-white px-2 py-1 rounded" onClick={() => onExport(item)}>Export</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Dashboard;
