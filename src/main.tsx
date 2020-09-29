import { CustomRenderer } from "customRenderer";
import { Laya } from "Laya";
import { layaInit } from "layaUtils";
import React, { useEffect, useRef, useState } from "react";
import { SkeletonPlayer } from "customRenderer";
import { Displace } from "utils/displace";
import { createCurvesByPath, vectorToDegree } from "utils/displaceUtil";
import { Skeleton } from "laya/ani/bone/Skeleton";

const path = [
  [-45, 1097, 81, 1314, 178, 1351],
  [178, 1351, 420, 1443, 587, 983, 827, 982],
];

const displace = new Displace(10, 0, createCurvesByPath(path));

function App() {
  const ref = useRef<Skeleton>();
  useEffect(() => {
    setInterval(() => {
      if (!ref.current) {
        return;
      }
      const { pos, is_complete } = displace.update(1);
      if (is_complete) {
        return;
      }
      ref.current.x = pos.x;
      ref.current.y = pos.y;
      ref.current.scaleX = -1;
    }, 1000 / 60);
  }, []);

  return (
    <>
      <SkeletonPlayer ref={ref as any} url="ani/fish/fish1.sk" />
    </>
  );
}

layaInit().then(() => {
  CustomRenderer.render(<App />, Laya.stage);
});
