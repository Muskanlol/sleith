import api from "./client";

export const dashboardApi = {
  getStats: () => {
    console.log("API CALL: GET /admin/dashboard/");
    return api.get("/admin/dashboard/");
  },
};