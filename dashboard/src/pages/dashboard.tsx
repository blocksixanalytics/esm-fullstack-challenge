import React, { useState, useEffect } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Plot from "react-plotly.js";
import { stringify } from "query-string";

import {
  Title,
  useList,
  ListContextProvider,
  DataTable,
  fetchUtils,
} from "react-admin";

import { API_BASE_URL } from "../utils/common";

const httpClient = async (url, options = {}) => {
  const { status, headers, body, json } = await fetchUtils.fetchJson(
    url,
    options,
  );
  return { status, headers, body, json };
};

const TopDriversByWins = () => {
  const query = {
    range: "[0, 9]",
  };
  const url = `${API_BASE_URL}/dashboard/top_drivers_by_wins?${stringify(query)}`;
  const options = {
    method: "GET",
    headers: new Headers({
      Accept: "application/json",
    }),
  };
  const [data, setData] = useState(null);
  useEffect(() => {
    httpClient(url, options).then(({ headers, json }) => {
      setData(json);
    });
  }, []);
  const listContext = useList({ data });
  if (data) {
    return (
      <ListContextProvider value={listContext}>
        <DataTable resource="drivers" sx={{ boxShadow: 1 }}>
          <DataTable.Col source="id" />
          <DataTable.Col source="full_name" />
          <DataTable.Col source="nationality" />
          <DataTable.Col source="number_of_wins" />
        </DataTable>
      </ListContextProvider>
    );
  }
  return null;
};

const TopConstructorsByWins = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    httpClient(`${API_BASE_URL}/dashboard/top_teams_by_wins`).then(({ json }) =>
      setData(json)
    );
  }, []);
  if (!data.length) return null;

  return (
    <Plot
      data={[
        {
          x: data.map((d) => d.constructor_name),
          y: data.map((d) => d.number_of_wins),
          type: "bar",
          marker: { color: "royalblue" },
        },
      ]}
      layout={{
        title: { text: "Top Constructors by Wins" },
        margin: { t: 40, b: 80 },
        xaxis: { tickangle: -45 },
      }}
      useResizeHandler
      style={{ width: "100%", height: "100%" }}
    />
  );
};

const WinsOverTimeChart = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    httpClient(`${API_BASE_URL}/dashboard/wins_over_time`).then(({ json }) =>
      setData(json)
    );
  }, []);

  if (!data.length) return null;

  // Group data by driver
  const driversMap = {};
  data.forEach((item) => {
    if (!driversMap[item.driver_name]) driversMap[item.driver_name] = [];
    driversMap[item.driver_name].push({ x: item.year, y: item.wins });
  });

const plotData = Object.entries(driversMap).map(([name, points]) => ({
    x: points.map((p) => p.x),
    y: points.map((p) => p.y),
    name,
    type: "scatter",
    mode: "lines+markers",
  }));

return (
    <Plot
      data={plotData}
      layout={{
        title: { text: "Driver Wins Over Time" },
        xaxis: { title: "Year" },
        yaxis: { title: "Number of Wins" },
        margin: { t: 40, b: 60 },
      }}
      useResizeHandler
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export const Dashboard = () => (
  <Card sx={{ m: 2, p: 2 }}>
    <Title title="F1 Dashboard" />
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
  	<Grid item xs={12} sm={6}>
    		<Typography variant="h4" gutterBottom sx={{ textAlign: "left" }}>
      			Top Drivers by Wins
    		</Typography>
    		<TopDriversByWins />
  	</Grid>
  	<Grid item xs={12} sm={6}>
    		<TopConstructorsByWins />
  	</Grid>
	<Grid item xs={12}>
    		<WinsOverTimeChart />
  	</Grid>
	</Grid>
    </Box>
  </Card>
);
