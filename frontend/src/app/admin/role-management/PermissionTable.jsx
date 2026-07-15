"use client";

import {
  Box,
  Checkbox,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
} from "@mui/material";

export default function PermissionTable({ permissions, onPermissionChange }) {
  const actions = ["view", "add", "edit", "delete"];

  const handleFeatureSelect = (module, feature, checked) => {
    actions.forEach((action) => {
      if (feature.permissions[action]) {
        onPermissionChange(
          module.moduleName,
          feature.featureId,
          action,
          checked,
        );
      }
    });
  };

  const handleModuleSelect = (module, checked) => {
    module.features.forEach((feature) => {
      actions.forEach((action) => {
        if (feature.permissions[action]) {
          onPermissionChange(
            module.moduleName,
            feature.featureId,
            action,
            checked,
          );
        }
      });
    });
  };

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        maxHeight: "calc(100vh - 260px)",
        borderRadius: 3,
      }}
    >
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell width={180}>
              <Typography fontWeight={700}>Module</Typography>
            </TableCell>

            <TableCell width={260}>
              <Typography fontWeight={700}>Feature</Typography>
            </TableCell>

            {actions.map((action) => (
              <TableCell key={action} align="center">
                <Typography fontWeight={700} textTransform="capitalize">
                  {action}
                </Typography>
              </TableCell>
            ))}

            <TableCell align="center">
              <Typography fontWeight={700}>All</Typography>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {permissions.map((module) => {
            const moduleChecked = module.features.every((feature) =>
              actions.every(
                (action) =>
                  !feature.permissions[action] ||
                  feature.permissions[action].allowed,
              ),
            );

            return module.features.map((feature, index) => {
              const rowChecked = actions.every(
                (action) =>
                  !feature.permissions[action] ||
                  feature.permissions[action].allowed,
              );

              return (
                <TableRow hover key={feature.featureId}>
                  {index === 0 && (
                    <TableCell
                      rowSpan={module.features.length}
                      sx={{
                        verticalAlign: "top",
                        bgcolor: "grey.50",
                        borderRight: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Stack spacing={2}>
                        <Typography fontWeight={700}>
                          {module.moduleName}
                        </Typography>

                        <Chip
                          size="small"
                          color="primary"
                          label={`${module.features.length} Features`}
                        />

                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            handleModuleSelect(module, !moduleChecked)
                          }
                        >
                          {moduleChecked ? "Disable All" : "Enable All"}
                        </Button>
                      </Stack>
                    </TableCell>
                  )}

                  <TableCell>
                    <Typography fontWeight={600}>
                      {feature.featureName}
                    </Typography>
                  </TableCell>

                  {actions.map((action) => (
                    <TableCell key={action} align="center">
                      <Checkbox
                        disabled={!feature.permissions[action]}
                        checked={Boolean(feature.permissions[action]?.allowed)}
                        onChange={(e) =>
                          onPermissionChange(
                            module.moduleName,
                            feature.featureId,
                            action,
                            e.target.checked,
                          )
                        }
                      />
                    </TableCell>
                  ))}

                  <TableCell align="center">
                    <Checkbox
                      checked={rowChecked}
                      onChange={(e) =>
                        handleFeatureSelect(module, feature, e.target.checked)
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            });
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
