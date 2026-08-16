"use client";

import React from "react";
import { MediaCard, MediaCardProps } from "./MediaCard";

export interface VideoPlayerProps extends MediaCardProps {}

export const VideoPlayer: React.FC<VideoPlayerProps> = (props) => {
  return <MediaCard {...props} />;
};

export default VideoPlayer;
