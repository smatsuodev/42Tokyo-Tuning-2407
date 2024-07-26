import axios, { AxiosInstance } from "axios";

class Axios {
  private static instance: AxiosInstance;

  private constructor() {}

  public static getInstance(): AxiosInstance {
    if (!Axios.instance) {
      Axios.instance = axios.create({
        withCredentials: true
      });
    }
    return Axios.instance;
  }
}

export default Axios;
