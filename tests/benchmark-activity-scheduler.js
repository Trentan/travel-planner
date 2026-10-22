const fs = require('fs');
const path = require('path');
const vm = require('vm');

function setupSandbox() {
  const sandbox = {
    console,
    window: {
      addEventListener: () => {}
    },
    appData: [],
    journeys: [],
    getDayJourneys: (date, from, to, legId) => {
      return [
        { id: 'j1', journeyId: 'j1', departureTime: '08:00', arrivalTime: '09:30', journeyName: 'Flight' }
      ];
    },
    getStayDisplayForDay: (date, city) => {
      return [
        { startTime: '15:00', type: 'checkin' }
      ];
    }
  };
  vm.createContext(sandbox);

  const schedulerCode = fs.readFileSync(path.join(__dirname, '..', 'js/activity-scheduler.js'), 'utf8');
  vm.runInContext(schedulerCode, sandbox);

  return sandbox;
}

function runBenchmark(iterations = 50000) {
  const sandbox = setupSandbox();

  const leg = { id: 'leg-1' };
  const day = {
    date: '2025-05-01',
    from: 'Paris',
    to: 'Paris',
    activityItems: [
      { text: 'Eiffel Tower', startTime: '10:00', endTime: '12:00', time: '2 hrs' },
      { text: 'Louvre Museum', startTime: '13:00', endTime: '15:00', time: '2 hrs' },
      { text: 'Dinner Cruise', startTime: '19:00', endTime: '21:00', time: '2 hrs' }
    ]
  };

  const activity = { title: 'Notre Dame', estTime: '1 hr' };
  const schedule = { startTime: '10:30', endTime: '11:30' }; // Conflicts with Eiffel Tower

  // Warmup
  for (let i = 0; i < 1000; i++) {
    sandbox.getActivityScheduleConflict(leg, day, activity, schedule);
  }

  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    sandbox.getActivityScheduleConflict(leg, day, activity, schedule);
  }
  const end = process.hrtime.bigint();

  const durationNs = Number(end - start);
  const durationMs = durationNs / 1000000;
  const opsPerSec = ((iterations / durationMs) * 1000).toFixed(0);

  console.log(`Executed ${iterations} calls to getActivityScheduleConflict in ${durationMs.toFixed(2)} ms (${opsPerSec} ops/sec)`);
  return { durationMs, opsPerSec, iterations };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
