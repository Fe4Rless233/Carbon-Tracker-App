"use client";
import React from "react";

function MainComponent() {
  const [carbonFootprint, setCarbonFootprint] = React.useState(0);
  const [activities, setActivities] = React.useState([]);
  const [customActivity, setCustomActivity] = React.useState("");
  const [customImpact, setCustomImpact] = React.useState("");
  const [selectedTimeframe, setSelectedTimeframe] = React.useState("day");
  const [goal, setGoal] = React.useState(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [streak, setStreak] = React.useState(0);
  const [lastActivityDate, setLastActivityDate] = React.useState(null);
  const [achievements, setAchievements] = React.useState([]);
  const [showChart, setShowChart] = React.useState(false);
  const [showAchievements, setShowAchievements] = React.useState(false);
  const [showChallenges, setShowChallenges] = React.useState(false);
  const [showEducation, setShowEducation] = React.useState(false);
  const addActivity = (activity, impact) => {
    const newActivity = {
      name: activity,
      impact,
      date: new Date().toISOString(),
    };
    setActivities([newActivity, ...activities]);
    setCarbonFootprint((prev) => prev + impact);
    updateStreak();
    checkAchievements([newActivity, ...activities]);
  };
  const updateStreak = () => {
    const today = new Date().toDateString();
    if (lastActivityDate !== today) {
      setStreak((prev) => prev + 1);
      setLastActivityDate(today);
    }
  };
  const checkAchievements = (updatedActivities) => {
    const newAchievements = [...achievements];
    if (
      updatedActivities.length === 10 &&
      !achievements.includes("Eco Tracker")
    ) {
      newAchievements.push("Eco Tracker");
    }
    if (
      updatedActivities.filter((a) => a.name === "Recycling").length === 5 &&
      !achievements.includes("Recycling Champion")
    ) {
      newAchievements.push("Recycling Champion");
    }
    if (carbonFootprint < -10 && !achievements.includes("Carbon Negative")) {
      newAchievements.push("Carbon Negative");
    }
    setAchievements(newAchievements);
  };
  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    setActivities(userData.activities || []);
    setCarbonFootprint(userData.carbonFootprint || 0);
    setAchievements(userData.achievements || []);
  };
  const handleRegister = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    setActivities([]);
    setCarbonFootprint(0);
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setActivities([]);
    setCarbonFootprint(0);
    setGoal(null);
  };
  const addCustomActivity = () => {
    if (customActivity && customImpact) {
      addActivity(customActivity, parseFloat(customImpact));
      setCustomActivity("");
      setCustomImpact("");
    }
  };
  const removeActivity = (index) => {
    const removedActivity = activities[index];
    setActivities(activities.filter((_, i) => i !== index));
    setCarbonFootprint((prev) => prev - removedActivity.impact);
  };
  const filteredActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.date);
    const now = new Date();
    switch (selectedTimeframe) {
      case "day":
        return activityDate.toDateString() === now.toDateString();
      case "week":
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return activityDate >= weekAgo;
      case "month":
        return (
          activityDate.getMonth() === now.getMonth() &&
          activityDate.getFullYear() === now.getFullYear()
        );
      default:
        return true;
    }
  });
  const getAdaptiveTips = () => {
    const tips = [];
    if (activities.some((a) => a.name.toLowerCase().includes("car"))) {
      tips.push(
        "Consider carpooling or using public transportation to reduce emissions from car trips."
      );
    }
    if (activities.some((a) => a.name.toLowerCase().includes("meat"))) {
      tips.push(
        "Try incorporating more plant-based meals into your diet to reduce your carbon footprint."
      );
    }
    if (activities.some((a) => a.name.toLowerCase().includes("air travel"))) {
      tips.push(
        "For your next trip, consider alternatives to air travel or offset your flight emissions."
      );
    }
    if (!activities.some((a) => a.name.toLowerCase().includes("recycling"))) {
      tips.push("Start recycling to reduce waste and conserve resources.");
    }
    return tips.length > 0
      ? tips
      : ["Keep tracking your activities to get personalized tips!"];
  };
  const totalFootprint = filteredActivities.reduce(
    (sum, activity) => sum + activity.impact,
    0
  );

  const LoginRegisterForm = ({ onLogin, onRegister }) => {
    const [isLogin, setIsLogin] = React.useState(true);
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const handleSubmit = (e) => {
      e.preventDefault();
      const userData = { id: Date.now(), name: username };
      if (isLogin) {
        onLogin(userData);
      } else {
        onRegister(userData);
      }
    };

    return (
      <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          {isLogin ? "Login" : "Register"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            {isLogin ? "Login" : "Register"}
          </button>
          <p className="text-center">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-500 hover:underline"
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </form>
      </div>
    );
  };

  React.useEffect(() => {
    const initCapacitor = async () => {
      try {
        await window.Capacitor.Plugins.SplashScreen.hide();
      } catch (error) {
        console.error("Error initializing Capacitor:", error);
      }
    };

    initCapacitor();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-blue-600 mb-8">
          Carbon Footprint Tracker
        </h1>
        {isLoggedIn ? (
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div>
                  <p className="text-lg font-semibold">Welcome, {user.name}!</p>
                  <p className="text-sm text-gray-600">
                    Current streak: {streak} days
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-300 mt-2 sm:mt-0"
                >
                  Logout
                </button>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 mb-4">
                Total Carbon Footprint: {carbonFootprint.toFixed(2)} kg CO2
              </p>
              {goal && (
                <p className="mb-4">
                  Goal: {goal} kg CO2 (
                  {((carbonFootprint / goal) * 100).toFixed(2)}% achieved)
                </p>
              )}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set a new goal:
                </label>
                <div className="flex flex-col sm:flex-row items-center">
                  <input
                    type="number"
                    value={goal || ""}
                    onChange={(e) => setGoal(parseFloat(e.target.value))}
                    className="w-full sm:w-auto flex-grow p-2 border border-gray-300 rounded sm:rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 sm:mb-0"
                    placeholder="Enter goal in kg CO2"
                  />
                  <button
                    onClick={() => setGoal(null)}
                    className="w-full sm:w-auto bg-gray-500 text-white py-2 px-4 rounded sm:rounded-r hover:bg-gray-600 transition duration-300"
                  >
                    Clear Goal
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-blue-600">
                  Add Activity
                </h2>
                <select
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded mb-2"
                >
                  <option value="">Select an activity</option>
                  <option value="Car Travel">Car Travel</option>
                  <option value="Public Transport">Public Transport</option>
                  <option value="Air Travel">Air Travel</option>
                  <option value="Meat Consumption">Meat Consumption</option>
                  <option value="Vegetarian Meal">Vegetarian Meal</option>
                  <option value="Recycling">Recycling</option>
                </select>
                <input
                  type="number"
                  value={customImpact}
                  onChange={(e) => setCustomImpact(e.target.value)}
                  placeholder="Impact (kg CO2)"
                  className="w-full p-2 border border-gray-300 rounded mb-2"
                />
                <button
                  onClick={addCustomActivity}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-300"
                >
                  Add Activity
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-blue-600">
                  Activity List
                </h2>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded mb-4"
                >
                  <option value="day">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredActivities.map((activity, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center bg-white p-2 rounded shadow"
                    >
                      <span>
                        {activity.name}: {activity.impact.toFixed(2)} kg CO2
                      </span>
                      <button
                        onClick={() => removeActivity(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2">
                  Total for {selectedTimeframe}: {totalFootprint.toFixed(2)} kg
                  CO2
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-blue-600">
                  Achievements
                </h2>
                <ul className="space-y-2">
                  {achievements.map((achievement, index) => (
                    <li key={index} className="bg-white p-2 rounded shadow">
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-blue-600">
                  Eco-friendly Tips
                </h2>
                <ul className="space-y-2">
                  {getAdaptiveTips().map((tip, index) => (
                    <li key={index} className="bg-white p-2 rounded shadow">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Eco-friendly Tips</h2>
              <ul>
                {getAdaptiveTips().map((tip, index) => (
                  <li key={index} className="mb-1">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setShowChart(!showChart)}
                className="w-full sm:w-auto bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
              >
                {showChart ? "Hide Chart" : "Show Chart"}
              </button>
              <button
                onClick={() => setShowAchievements(!showAchievements)}
                className="w-full sm:w-auto bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-300"
              >
                {showAchievements ? "Hide Achievements" : "Show Achievements"}
              </button>
              <button
                onClick={() => setShowChallenges(!showChallenges)}
                className="w-full sm:w-auto bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition duration-300"
              >
                {showChallenges ? "Hide Challenges" : "Show Challenges"}
              </button>
              <button
                onClick={() => setShowEducation(!showEducation)}
                className="w-full sm:w-auto bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600 transition duration-300"
              >
                {showEducation ? "Hide Education" : "Show Education"}
              </button>
            </div>
            {showChart && (
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">
                  Carbon Footprint Chart
                </h2>
                <p>Chart component would go here</p>
              </div>
            )}
            {showAchievements && (
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">All Achievements</h2>
                <ul>
                  <li>Eco Tracker: Log 10 activities</li>
                  <li>Recycling Champion: Log 5 recycling activities</li>
                  <li>Carbon Negative: Achieve a negative carbon footprint</li>
                </ul>
              </div>
            )}
            {showChallenges && (
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">Eco Challenges</h2>
                <ul>
                  <li>Go Meatless Monday</li>
                  <li>Use public transport for a week</li>
                  <li>Start a home composting system</li>
                </ul>
              </div>
            )}
            {showEducation && (
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">
                  Environmental Education
                </h2>
                <p>
                  Learn about climate change, renewable energy, and sustainable
                  living practices.
                </p>
              </div>
            )}
          </div>
        ) : (
          <LoginRegisterForm
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        )}
      </div>
    </div>
  );
}

export default MainComponent;