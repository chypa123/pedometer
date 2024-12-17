import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Accelerometer } from "expo-sensors";

// Функция для получения количества дней в месяце
const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();

// Функция для генерации календаря
const generateCalendar = (month, year) => {
  const days = [];
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(month, year);

  // Заполняем календарь пустыми днями до первого дня месяца
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Добавляем дни месяца
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  // Добавляем пустые ячейки после последнего дня месяца
  const lastDay = new Date(year, month, totalDays).getDay();
  const emptyCells = 6 - lastDay;
  for (let i = 0; i < emptyCells; i++) {
    days.push(null);
  }

  return days;
};

export default function App() {
  const [date, setDate] = useState(new Date());
  const [steps, setSteps] = useState(0);
  const [stepData, setStepData] = useState({});
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  const [lastAcceleration, setLastAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [selectedDaySteps, setSelectedDaySteps] = useState(null);
  const [selectedDayDate, setSelectedDayDate] = useState("");
  const [currentDay, setCurrentDay] = useState(new Date().toISOString().split("T")[0]); // Инициализируем текущий день
  const [timeUntilNextDay, setTimeUntilNextDay] = useState(0); // Время до следующего дня в секундах

  const month = date.getMonth();
  const year = date.getFullYear();
  const calendarDays = generateCalendar(month, year);
  const today = new Date();

  useEffect(() => {
    const subscription = Accelerometer.addListener((data) => {
      setAccelerometerData(data);
      detectSteps(data);
    });

    Accelerometer.setUpdateInterval(100);

    // Функция для отслеживания времени до следующего дня
    const interval = setInterval(() => {
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0); // Устанавливаем время на начало следующего дня
      const secondsUntilTomorrow = Math.floor((tomorrow - new Date()) / 1000); // Сколько секунд осталось до завтра
      setTimeUntilNextDay(secondsUntilTomorrow);

      // Если осталось 1 секунда до следующего дня, проверяем смену дня
      if (secondsUntilTomorrow <= 1) {
        checkForNewDay();
      }
    }, 1000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [steps, stepData]);

  const detectSteps = ({ x, y, z }) => {
    const threshold = 1.2;

    const deltaX = Math.abs(x - lastAcceleration.x);
    const deltaY = Math.abs(y - lastAcceleration.y);
    const deltaZ = Math.abs(z - lastAcceleration.z);

    if (deltaX > threshold || deltaY > threshold || deltaZ > threshold) {
      setSteps((prevSteps) => prevSteps + 1);
    }

    setLastAcceleration({ x, y, z });
  };

  const checkForNewDay = () => {
    const newDay = new Date(Date.now() + 1000).toISOString().split("T")[0]; // Получаем дату через 1 секунду
    saveStepsForDay(currentDay); // Сохраняем шаги за старый день
    setSteps(0); // Обнуляем шаги
    setCurrentDay(newDay); // Обновляем сохраненную дату на новый день
  };

  const saveStepsForDay = (day) => {
    setStepData((prevData) => {
      const updatedData = { ...prevData, [day]: steps };
      return updatedData;
    });
  };

  const changeMonth = (offset) => {
    const newDate = new Date(year, month + offset, 1);
    setDate(newDate);
  };

  const handleDayPress = (day) => {
    if (day) {
      const selectedDate = new Date(year, month, day).toISOString().split("T")[0];
      const savedSteps = stepData[selectedDate] || 0;
      setSelectedDaySteps(savedSteps);
      const formattedDate = `${day}.${month + 1}.${year}`;
      setSelectedDayDate(formattedDate);
    }
  };

  const getTodaySteps = () => {
    const todayDate = `${today.getDate()}.${month + 1}.${year}`;
    if (selectedDayDate === todayDate || selectedDayDate === "") {
      return `Шаги за сегодня: ${steps}`;
    } else {
      return `Шаги за ${selectedDayDate}: ${selectedDaySteps}`;
    }
  };

  const isFutureDay = (day) => {
    const currentDate = new Date(year, month, day);
    return currentDate > today;
  };

  return (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Text style={styles.button}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {date.toLocaleString("default", { month: "long" })} {year}
          </Text>
          <TouchableOpacity
            onPress={() => changeMonth(1)}
            disabled={month === today.getMonth() && year === today.getFullYear()}
          >
            <Text style={styles.button}>{">"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calendar}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <Text key={day} style={styles.dayName}>
              {day}
            </Text>
          ))}
          {calendarDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.day,
                day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                  ? styles.today
                  : null,
              ]}
              onPress={() => handleDayPress(day)}
              disabled={day === null || isFutureDay(day)}
            >
              <Text style={isFutureDay(day) ? styles.disabledText : {}}>{day || ""}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.stepsContainer}>
        <Text style={styles.stepsTitle}>{getTodaySteps()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    paddingTop: 70,
  },
  calendarContainer: {
    width: "90%",
    marginBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  button: {
    fontSize: 24,
    color: "#007AFF",
  },
  calendar: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  dayName: {
    width: "14.28%",
    textAlign: "center",
    fontWeight: "bold",
    paddingVertical: 5,
  },
  day: {
    width: "14.28%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  today: {
    backgroundColor: "#007AFF",
  },
  disabledText: {
    color: "#D3D3D3",
  },
  stepsContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
});


// import React, { useState, useEffect } from "react";
// import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
// import { Accelerometer } from "expo-sensors";

// const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();

// const generateCalendar = (month, year) => {
//   const days = [];
//   const firstDay = new Date(year, month, 1).getDay();
//   const totalDays = daysInMonth(month, year);

//   for (let i = 0; i < firstDay; i++) {
//     days.push(null);
//   }

//   for (let i = 1; i <= totalDays; i++) {
//     days.push(i);
//   }

//   const lastDay = new Date(year, month, totalDays).getDay();
//   const emptyCells = 6 - lastDay;
//   for (let i = 0; i < emptyCells; i++) {
//     days.push(null);
//   }

//   return days;
// };

// export default function App() {
//   const [date, setDate] = useState(new Date());
//   const [steps, setSteps] = useState(0);
//   const [stepData, setStepData] = useState({});
//   const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
//   const [lastAcceleration, setLastAcceleration] = useState({ x: 0, y: 0, z: 0 });

//   const [selectedDaySteps, setSelectedDaySteps] = useState(null); 
//   const [selectedDayDate, setSelectedDayDate] = useState('');

//   const month = date.getMonth();
//   const year = date.getFullYear();
//   const calendarDays = generateCalendar(month, year);
//   const today = new Date();

//   useEffect(() => {
//     const subscription = Accelerometer.addListener((data) => {
//       setAccelerometerData(data);
//       detectSteps(data);
//     });

//     Accelerometer.setUpdateInterval(100);

//     const interval = setInterval(() => {
//       checkForNewDay();
//     }, 1000);

//     return () => {
//       subscription.remove();
//       clearInterval(interval);
//     };
//   }, [steps, stepData]);

//   const detectSteps = ({ x, y, z }) => {
//     const threshold = 1.2;

//     const deltaX = Math.abs(x - lastAcceleration.x);
//     const deltaY = Math.abs(y - lastAcceleration.y);
//     const deltaZ = Math.abs(z - lastAcceleration.z);

//     if (deltaX > threshold || deltaY > threshold || deltaZ > threshold) {
//       setSteps((prevSteps) => prevSteps + 1);
//     }

//     setLastAcceleration({ x, y, z });
//   };

//   const checkForNewDay = () => {
//     const currentDay = today.toISOString().split("T")[0];
//     const newDay = new Date().toISOString().split("T")[0];

//     if (currentDay !== newDay) {
//       saveStepsForDay(currentDay);
//       today.setDate(today.getDate() + 1); 
//       setSteps(0); 
//     }
//   };

//   const saveStepsForDay = (day) => {
//     setStepData((prevData) => ({
//       ...prevData,
//       [day]: steps,
//     }));
//   };

//   const changeMonth = (offset) => {
//     const newDate = new Date(year, month + offset, 1);
//     setDate(newDate);
//   };

//   const handleDayPress = (day) => {
//     if (day) {
//       const selectedDate = new Date(year, month, day).toISOString().split("T")[0];
//       const savedSteps = stepData[selectedDate] || 0;
//       setSelectedDaySteps(savedSteps);
//       const formattedDate = `${day}.${month + 1}.${year}`;
//       setSelectedDayDate(formattedDate);
//       //alert(`Шаги за ${day}.${month + 1}.${year}: ${savedSteps}`);
//     }
//   };
  
//   const isFutureDay = (day) => {
//     const currentDate = new Date(year, month, day);
//     return currentDate > today;
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.calendarContainer}>
//         <View style={styles.header}>

//           <TouchableOpacity onPress={() => changeMonth(-1)}>
//             <Text style={styles.button}>{"<"}</Text>
//           </TouchableOpacity>
//           <Text style={styles.title}>
//             {date.toLocaleString("default", { month: "long" })} {year}
//           </Text>
//           <TouchableOpacity
//             onPress={() => changeMonth(1)}
//             disabled={month === today.getMonth() && year === today.getFullYear()}
//           >
//             <Text style={styles.button}>{">"}</Text>
//           </TouchableOpacity>
//         </View>

//         <View style={styles.calendar}>
//           {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
//             <Text key={day} style={styles.dayName}>
//               {day}
//             </Text>
//           ))}
//           {calendarDays.map((day, index) => (
//             <TouchableOpacity
//               key={index}
//               style={[
//                 styles.day,
//                 day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
//                   ? styles.today
//                   : null,
//               ]}
//               onPress={() => handleDayPress(day)}
//               disabled={day === null || isFutureDay(day)}
//             >
//               <Text style={isFutureDay(day) ? styles.disabledText : {}}>{day || ""}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </View>

//        <View style={styles.stepsContainer}>
//         {/* Теперь показываем шаги для выбранного дня, если они есть */}
//         {selectedDaySteps !== null ? (
//           <Text style={styles.stepsTitle}>
//             Шаги за {selectedDayDate}: {selectedDaySteps}
//           </Text>
//         ) : (
//           <Text style={styles.stepsTitle}>
//             Шаги сегодня: {steps}
//           </Text>
//         )}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "flex-start",
//     alignItems: "center",
//     backgroundColor: "#f0f8ff",
//     paddingTop: 70,
//   },
//   calendarContainer: {
//     width: "90%",
//     marginBottom: 40,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     width: "100%",
//     marginBottom: 10,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   button: {
//     fontSize: 24,
//     color: "#007AFF",
//   },
//   calendar: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     width: "100%",
//   },
//   dayName: {
//     width: "14.28%",
//     textAlign: "center",
//     fontWeight: "bold",
//     paddingVertical: 5,
//   },
//   day: {
//     width: "14.28%",
//     height: 50,
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#ccc",
//   },
//   today: {
//     backgroundColor: "#007AFF",
//   },
//   disabledText: {
//     color: "#D3D3D3",
//   },
//   stepsContainer: {
//     alignItems: "center",
//     marginTop: 20,
//   },
//   stepsTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//   },
// });
