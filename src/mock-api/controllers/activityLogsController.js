const path = require('path');
const fs = require('fs');

exports.getActivityLogs = (req, res) => {
  const filePath = path.join(__dirname, '../../localdb/activityLogs.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read data' });
    res.json(JSON.parse(data));
  });
};

exports.addActivityLog = (req, res) => {
  const filePath = path.join(__dirname, '../../localdb/activityLogs.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read data' });
    let logs = [];
    try {
      logs = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse data' });
    }
    const newLog = req.body;
    newLog.id = logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1;
    logs.push(newLog);
    fs.writeFile(filePath, JSON.stringify(logs, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to write data' });
      res.status(201).json(newLog);
    });
  });
}; 