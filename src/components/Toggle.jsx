import React, { useEffect, useState } from "react";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import useGetUserData from "../customHooks/useGetUserData";
import { useGlobalState } from "../context/GlobalStateProvider";

const Toggle = () => {
  const [isOn, setIsOn] = useState(false);
  const toggleValue = useSharedValue(isOn ? 1 : 0);
  const { userInfo, setUserInfo } = useGlobalState();
  const [id, setId] = useState(null);
  const toggleWidth = 60; // Width of the toggle button
  const thumbWidth = 28; // Width of the toggle thumb

  const toggleButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: toggleValue.value * (toggleWidth - thumbWidth - 6), // Adjust for padding
        },
      ],
    };
  });

  const data = useGetUserData();

  // Fetch user data from AsyncStorage on component mount
  const fetchUserDataFromStorage = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem("userData");
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        const isUser = parsedData.data?.data?.userType === "user";
        setIsOn(isUser);
        toggleValue.value = withSpring(isUser ? 0 : 1); // Set the initial toggle state
      }
    } catch (err) {
      console.log("Error fetching user data from storage:", err);
    }
  };

  useEffect(() => {
    setId(data?.data?.data?._id); // Set user ID from fetched data
    fetchUserDataFromStorage(); // Fetch the user data on mount
  }, [data]);

  const toggleType = async (id) => {
    try {
      const type = isOn ? "user" : "rider";
      const res = await fetch(`https://api.funrides.co.uk/api/v1/toggleType/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userType: type, // Send the userType in the request body
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log("Error response from toggle:", errorData);
        return;
      }

      const response = await res.json();
      console.log("Response from toggle:", response);

      // Update the userType in AsyncStorage and the global state
      const storedUserData = await AsyncStorage.getItem("userData");
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        parsedData.data.data.userType = type; // Update the userType in AsyncStorage
        await AsyncStorage.setItem("userData", JSON.stringify(parsedData)); // Save the updated data
      }

      // Update global state with new userType
      setUserInfo({ ...userInfo, userType: type });

      console.log("User type toggled successfully", storedUserData);
    } catch (err) {
      console.log("Error in toggling user/rider:", err);
    }
  };

  const handleToggle = async () => {
    const newToggleState = !isOn; // Flip the toggle state
    setIsOn(newToggleState); // Update state locally
    toggleValue.value = withSpring(newToggleState ? 0 : 1); // Animate the toggle

    // Call the API to toggle user type when toggling
    if (id) {
      await toggleType(id); // Update the user type via the API
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.toggleButton} onPress={handleToggle}>
        <Animated.View style={[styles.toggleThumb, toggleButtonStyle]}>
          <Text style={styles.toggleText}>{isOn ? "rider" : "user"}</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleButton: {
    width: 60,
    height: 34,
    backgroundColor: "#ccc",
    borderRadius: 17,
    padding: 3,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 28,
    height: 28,
    backgroundColor: "#fff",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleText: {
    fontSize: 12,
    color: "#333",
  },
});

export default Toggle;
