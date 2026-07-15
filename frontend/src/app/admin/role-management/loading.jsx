import { Box, Skeleton, Card, CardContent, Stack } from "@mui/material";

export default function Loading() {
  return (
    <Box p={3}>
      <Stack spacing={3}>
        <Skeleton variant="text" width={300} height={45} />

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={50} />
              <Skeleton variant="rounded" height={50} />
            </Stack>
          </CardContent>
        </Card>

        <Box display="flex" gap={3}>
          <Skeleton variant="rounded" width="28%" height={650} />
          <Skeleton variant="rounded" width="72%" height={650} />
        </Box>
      </Stack>
    </Box>
  );
}
